import { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, Sparkles, Loader2, Settings, HelpCircle, Trash2 } from 'lucide-react';
import type { InputSectionProps, Flashcard, APIConfig, ChatCompletionResponse } from '../types';

export default function InputSection({ onSave, onAiEnabledChange, initialAiEnabled }: InputSectionProps) {
    // Load from local storage or default to empty
    const [text, setText] = useState(() => localStorage.getItem('flashcards_input_text') || '');
    const [context, setContext] = useState(() => localStorage.getItem('flashcards_input_context') || '');

    const [error, setError] = useState<string | null>(null);
    const [useAI, setUseAI] = useState(initialAiEnabled || false);
    const [isLoading, setIsLoading] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // Save to local storage whenever text or context changes
    useEffect(() => {
        localStorage.setItem('flashcards_input_text', text);
    }, [text]);

    useEffect(() => {
        localStorage.setItem('flashcards_input_context', context);
    }, [context]);

    // API Config State
    const [showSettings, setShowSettings] = useState(false);
    const [apiConfig, setApiConfig] = useState<APIConfig>(() => {
        const saved = localStorage.getItem('flashcards_api_config');
        return saved ? JSON.parse(saved) : {
            provider: 'openrouter',
            apiKey: '',
            model: 'google/gemini-2.0-flash-exp:free'
        };
    });

    const updateApiConfig = (newConfig: Partial<APIConfig>) => {
        const updated = { ...apiConfig, ...newConfig };
        setApiConfig(updated);
        localStorage.setItem('flashcards_api_config', JSON.stringify(updated));
    };

    const handleClear = () => {
        if (window.confirm("確定要清除詞彙框嗎？")) {
            setText('');
            localStorage.removeItem('flashcards_input_text');
        }
    };

    // Ensure model and provider are valid on mount
    useEffect(() => {
        const validModels = [
            "openai/gpt-oss-120b",
            "qwen/qwen3-vl-235b-a22b-instruct",
            "z-ai/glm-4.5-air",
            "openai/gpt-5.2-chat",
            "anthropic/claude-haiku-4.5",
            "google/gemini-3-flash-preview"
        ];

        const updates: Partial<APIConfig> = {};
        if (apiConfig.provider !== 'openrouter') {
            updates.provider = 'openrouter';
        }
        if (!validModels.includes(apiConfig.model)) {
            updates.model = validModels[0];
        }

        if (Object.keys(updates).length > 0) {
            updateApiConfig(updates);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const handleSave = () => {
        try {
            if (useAI) {
                generateFlashcards();
                return;
            }
            parseAndSave(text);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const parseAndSave = (inputText: string) => {
        try {
            const lines = inputText.trim().split('\n');
            const cards: Flashcard[] = [];
            lines.forEach((line, index) => {
                if (!line.trim()) return;
                // Robust Parse: Try Pipe first, then Comma
                let delimiter = '|';
                let splitIndex = line.indexOf(delimiter);

                if (splitIndex === -1) {
                    delimiter = ',';
                    splitIndex = line.indexOf(delimiter);
                }

                if (splitIndex === -1) {
                    throw new Error(`第 ${index + 1} 行缺少分隔符號（| 或 ,）：「${line}」`);
                }

                const clean = (s: string) => s.trim().replace(/^(['"])(.*)\1$/, '$2');
                const term = clean(line.substring(0, splitIndex));
                const definition = clean(line.substring(splitIndex + 1));

                if (!term || !definition) {
                    throw new Error(`第 ${index + 1} 行的詞彙或定義為空。`);
                }
                cards.push({ id: Math.random().toString(36).substr(2, 9), term, definition });
            });

            if (cards.length === 0) {
                throw new Error("找不到有效的卡片。");
            }

            onSave(cards);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const generateFlashcards = async () => {
        if (!text.trim()) {
            setError("請輸入要產生卡片的文字。");
            return;
        }

        const apiKey = apiConfig.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
        // If still no key and using OpenAI, error. OpenRouter might use free env key.
        if (!apiKey && apiConfig.provider === 'openai') {
            setError("請在設定中輸入您的 OpenAI API 金鑰。");
            setShowSettings(true);
            return;
        }

        // Determine URL and Headers based on provider
        let url: string, headers: HeadersInit, body: object;

        if (apiConfig.provider === 'openai') {
            url = "https://api.openai.com/v1/chat/completions";
            headers = {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            };
            body = {
                model: apiConfig.model,
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful flashcard generator. extracting key terms and definitions from the user's text.
                        ${context ? `CONTEXT: The user is studying "${context}". Use this to ensure definitions are relevant to this topic.` : ''}
                        Your output must be strictly in CSV format: TERM,DEFINITION. One per line. Do not include markdown code blocks, headers, or any other conversation. Do not number the lines. Example:
                        Apple,A red fruit
                        Banana,A yellow fruit`
                    },
                    { role: "user", content: text }
                ]
            };
        } else {
            // OpenRouter (Default)
            url = "https://openrouter.ai/api/v1/chat/completions";
            headers = {
                "Authorization": `Bearer ${apiKey || import.meta.env.VITE_OPENROUTER_API_KEY}`,
                "HTTP-Referer": window.location.origin,
                "X-Title": "FlashMaster",
                "Content-Type": "application/json"
            };
            body = {
                model: apiConfig.model,
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful flashcard generator. extracting key terms and definitions from the user's text.
                        ${context ? `CONTEXT: The user is studying "${context}". Use this to ensure definitions are relevant to this topic.` : ''}
                        Your output must be strictly in CSV format: TERM,DEFINITION. One per line. Do not include markdown code blocks, headers, or any other conversation. Do not number the lines. Example:
                        Apple,A red fruit
                        Banana,A yellow fruit`
                    },
                    { role: "user", content: text }
                ]
            };
        }

        setIsLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 60000); // Increased to 60s

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                signal: controller.signal,
                body: JSON.stringify(body)
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                let message = "擷取失敗";
                try {
                    const errData = JSON.parse(errorText);
                    message = errData.error?.message || message;
                } catch {
                    /* ignore */
                }

                if (response.status === 401) {
                    throw new Error("API 金鑰無效，請在設定中檢查您的金鑰。");
                }
                throw new Error(`${message}（狀態：${response.status}）`);
            }

            const data: ChatCompletionResponse = await response.json();
            const content = data.choices[0].message.content;

            // Clean up potential markdown code blocks if the AI disobeyed
            const cleanContent = content.replace(/```csv/g, '').replace(/```/g, '').trim();

            parseAndSave(cleanContent);

        } catch (err) {
            if ((err as Error).message.includes("Failed to fetch")) {
                setError("連線失敗。您在設定中有有效的 API 金鑰嗎？");
            } else {
                setError("AI 產生失敗：" + (err as Error).message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const generateTermsOnly = async () => {
        if (!context.trim()) {
            setError("請在選填情境欄位中輸入主題以產生詞彙（例如「CISSP 領域 1」）。");
            return;
        }

        const apiKey = apiConfig.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!apiKey && apiConfig.provider === 'openai') {
            setError("請在設定中輸入您的 OpenAI API 金鑰。");
            setShowSettings(true);
            return;
        }

        setIsLoading(true);
        setError(null);

        let url: string, headers: HeadersInit, body: object;
        const prompt = `Generate 30 high-quality flashcards for the topic: "${context}". Output strictly in CSV format: TERM,DEFINITION. One per line. Do not number lines. No intro/outro text. Example:
        Apple,A red fruit
        Banana,A yellow fruit`;

        if (apiConfig.provider === 'openai') {
            url = "https://api.openai.com/v1/chat/completions";
            headers = {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            };
            body = {
                model: apiConfig.model,
                messages: [{ role: "user", content: prompt }]
            };
        } else {
            url = "https://openrouter.ai/api/v1/chat/completions";
            headers = {
                "Authorization": `Bearer ${apiKey || import.meta.env.VITE_OPENROUTER_API_KEY}`,
                "HTTP-Referer": window.location.origin,
                "X-Title": "FlashMaster",
                "Content-Type": "application/json"
            };
            body = {
                model: apiConfig.model,
                messages: [{ role: "user", content: prompt }]
            };
        }

        try {
            const response = await fetch(url, {
                method: "POST", headers, body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 401) {
                    throw new Error("API 金鑰無效，請在設定中檢查您的金鑰。");
                }
                throw new Error(`產生失敗（狀態：${response.status}）。${errorText.substring(0, 100)}`);
            }

            const data: ChatCompletionResponse = await response.json();
            const content = data.choices[0].message.content;
            const cleanContent = content.replace(/```csv/g, '').replace(/```/g, '').trim();

            setText(prev => prev ? prev + '\n' + cleanContent : cleanContent);

        } catch (err) {
            if ((err as Error).message.includes("Failed to fetch")) {
                setError("連線失敗。您在設定中有有效的 API 金鑰嗎？");
            } else {
                setError((err as Error).message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const placeholderCSV = `CIA 三元組,機密性、完整性、可用性
AES,進階加密標準
雙因素驗證,您知道的東西加上您擁有的東西`;

    const placeholderAI = `在這裡貼上您的學習筆記！例如：

安全模型對於 CISSP 非常重要。Bell-LaPadula 模型專注於機密性，具有「不可向上讀取、不可向下寫入」的規則。而 Biba 則專注於完整性。`;

    return (
        <div className="input-container">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <div className="action-bar">
                    <button
                        onClick={() => setShowHelp(true)}
                        className="btn-secondary action-btn help-btn"
                        title="使用說明"
                    >
                        <HelpCircle size={14} />
                        <span className="btn-text">說明</span>
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="btn-secondary action-btn"
                        title="AI 設定"
                    >
                        <Settings size={14} />
                        <span className="btn-text">設定</span>
                    </button>
                    <label className={`ai-toggle ${useAI ? 'active' : ''}`}>
                        <input
                            type="checkbox"
                            checked={useAI}
                            onChange={(e) => {
                                const newValue = e.target.checked;
                                setUseAI(newValue);
                                if (onAiEnabledChange) onAiEnabledChange(newValue);
                            }}
                        />
                        <Sparkles size={12} className="ai-icon" />
                        <span className="ai-label">
                            使用 AI 產生
                        </span>
                    </label>
                </div>
                {!useAI && (
                    <div style={{ fontSize: '0.7rem', color: 'orange', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
                        <AlertCircle size={12} />
                        注意：關閉 AI 將停用回想模式和干擾選項產生功能。
                    </div>
                )}
            </div>

            {/* Help Modal */}
            {showHelp && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem',
                        maxWidth: '500px', width: '100%', border: '1px solid var(--border)',
                        position: 'relative', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h3 style={{ marginTop: 0 }}>如何使用閃卡大師</h3>
                        <div style={{ lineHeight: 1.6, color: 'var(--text-secondary)', textAlign: 'left' }}>
                            <p style={{ marginBottom: '1.5rem' }}>
                                閃卡大師旨在幫助您使用自訂閃卡、測驗和配對遊戲有效率地學習。
                            </p>

                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1rem' }}>1. 手動模式</h4>
                            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', marginTop: 0 }}>
                                <li><strong>輸入格式：</strong>每行輸入一個詞彙和定義，以逗號（或管道符號 `|`）分隔。</li>
                                <li><strong>範例：</strong> <code>詞彙, 定義</code></li>
                                <li><strong>開始：</strong>點擊「建立閃卡」立即開始學習。</li>
                            </ul>

                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1rem' }}>2. AI 產生模式</h4>
                            <p style={{ marginBottom: '0.5rem' }}>
                                利用 AI 從原始文字自動產生學習材料。
                            </p>
                            <ul style={{ paddingLeft: '1.5rem', marginBottom: '0', marginTop: 0 }}>
                                <li><strong>啟用：</strong>切換頂部的「使用 AI 產生」開關。</li>
                                <li><strong>情境：</strong>可選擇添加主題（例如「CISSP 領域 1」）來引導產生。</li>
                                <li><strong>輸入：</strong>將您的筆記、識別碼或摘要文字貼到主要文字區。</li>
                                <li><strong>產生：</strong>點擊「產生詞彙」以填充清單供審閱，或點擊「產生並開始」立即開始。</li>
                                <li><strong>回想模式：</strong>啟用 AI 可解鎖回想模式，這是一種更進階的測試方法。</li>
                            </ul>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ marginTop: '2rem', width: '100%' }}
                            onClick={() => setShowHelp(false)}
                        >
                            了解！
                        </button>
                    </div>
                </div>
            )}

            {showSettings && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1rem',
                    textAlign: 'left'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>AI 設定</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>API 金鑰（儲存於瀏覽器）</label>
                        <input
                            type="password"
                            value={apiConfig.apiKey}
                            onChange={(e) => updateApiConfig({ apiKey: e.target.value })}
                            placeholder="sk-or-..."
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', background: '#0f172a', color: 'white', border: '1px solid var(--border)' }}
                        />
                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            您的金鑰儲存在瀏覽器中，並直接傳送至 OpenRouter API。
                        </p>
                    </div>

                    <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>模型</label>
                        <select
                            value={apiConfig.model}
                            onChange={(e) => updateApiConfig({ model: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', background: '#0f172a', color: 'white', border: '1px solid var(--border)' }}
                        >
                            <option value="openai/gpt-oss-120b">GPT OSS 120B</option>
                            <option value="qwen/qwen3-vl-235b-a22b-instruct">Qwen3 VL 235B</option>
                            <option value="z-ai/glm-4.5-air">GLM 4.5 Air</option>
                            <option value="openai/gpt-5.2-chat">GPT 5.2</option>
                            <option value="anthropic/claude-haiku-4.5">Claude Haiku 4.5</option>
                            <option value="google/gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                        </select>
                    </div>
                </div>
            )}

            {useAI && (
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder="選填情境（例如「CISSP 領域 1」、「生物學 101」）"
                        maxLength={100}
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0.75rem',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            fontFamily: 'var(--font-family)'
                        }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {context.length}/100
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: '0' }}>
                        在下方貼上您的筆記、文章或摘要，AI 將為您擷取詞彙。
                    </p>
                </div>
            )}

            <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                    <span>在下方貼上您的詞彙，每行一個，以逗號分隔：<code>詞彙,定義</code></span>
                </p>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textAlign: 'left'
                }}>
                    <AlertCircle size={20} />
                    <div>{error}</div>
                </div>
            )}

            <div style={{ position: 'relative', display: 'flex', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden', minHeight: '300px', background: 'var(--bg-card)' }}>
                <div
                    ref={lineNumbersRef}
                    className="line-numbers"
                    style={{
                        padding: '1rem 0.5rem',
                        background: '#0f172a',
                        color: 'var(--text-secondary)',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        minWidth: '3rem',
                        userSelect: 'none',
                        overflow: 'hidden',
                        opacity: 0.6
                    }}
                >
                    {text.split('\n').map((_, i) => (
                        <div key={i}>{i + 1}</div>
                    ))}
                    {/* Always show at least row 1 */}
                    {text === '' && <div>1</div>}
                </div>
                <textarea
                    ref={textareaRef}
                    className="input-area"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onScroll={handleScroll}
                    placeholder={useAI ? placeholderAI : placeholderCSV}
                    disabled={isLoading}
                    style={{
                        border: 'none',
                        borderRadius: 0,
                        resize: 'none',
                        lineHeight: '1.5',
                        flex: 1,
                        outline: 'none'
                    }}
                />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <button
                    className="btn-secondary"
                    onClick={handleClear}
                    style={{ color: '#ef4444', borderColor: '#ef4444', padding: '0.5rem 1rem' }}
                    title="清除所有文字"
                >
                    <Trash2 size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    清除
                </button>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
                    {useAI && (
                        <button
                            className="btn-secondary"
                            onClick={generateTermsOnly}
                            disabled={isLoading}
                        >
                            產生詞彙
                        </button>
                    )}
                    <button className="btn-primary" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="spin" style={{ marginRight: '0.5rem', verticalAlign: 'middle', animation: 'spin 1s linear infinite' }} />
                                產生中...
                            </>
                        ) : (
                            <>
                                {useAI ? <Sparkles size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> : <Save size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />}
                                {useAI ? "產生並開始" : "建立閃卡"}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {isLoading && useAI && (
                <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    產生閃卡應該不會超過 30 秒，視新增數量而定...
                </div>
            )}

            <style>{`
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
    );
}
