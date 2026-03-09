import { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, Sparkles, Loader2, Settings, Trash2 } from 'lucide-react';
import type { InputSectionProps, Flashcard, APIConfig, ChatCompletionResponse } from '../types';

export default function InputSection({ onSave, onAiEnabledChange, initialAiEnabled }: InputSectionProps) {
    // Load from local storage or default to empty
    const [text, setText] = useState(() => localStorage.getItem('flashcards_input_text') || '');
    const [context, setContext] = useState(() => localStorage.getItem('flashcards_input_context') || '');

    const [error, setError] = useState<string | null>(null);
    const [useAI, setUseAI] = useState(initialAiEnabled || false);
    const [isLoading, setIsLoading] = useState(false);


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
        if (window.confirm("Are you sure you want to clear the text?")) {
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
                    throw new Error(`Line ${index + 1} is missing a delimiter (| or ,): "${line}"`);
                }

                const clean = (s: string) => s.trim().replace(/^(['"])(.*)\1$/, '$2');
                const term = clean(line.substring(0, splitIndex));
                const definition = clean(line.substring(splitIndex + 1));

                if (!term || !definition) {
                    throw new Error(`Line ${index + 1} has an empty term or definition.`);
                }
                cards.push({ id: Math.random().toString(36).substr(2, 9), term, definition });
            });

            if (cards.length === 0) {
                throw new Error("No valid cards found.");
            }

            onSave(cards);
            setError(null);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const generateFlashcards = async () => {
        if (!text.trim()) {
            setError("Please enter text to generate cards from.");
            return;
        }

        const apiKey = apiConfig.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
        // If still no key and using OpenAI, error. OpenRouter might use free env key.
        if (!apiKey && apiConfig.provider === 'openai') {
            setError("Please enter your OpenAI API key in Settings.");
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
                let message = "Fetch failed";
                try {
                    const errData = JSON.parse(errorText);
                    message = errData.error?.message || message;
                } catch {
                    /* ignore */
                }

                if (response.status === 401) {
                    throw new Error("Invalid API key. Please check your key in Settings.");
                }
                throw new Error(`${message} (status: ${response.status})`);
            }

            const data: ChatCompletionResponse = await response.json();
            const content = data.choices[0].message.content;

            // Clean up potential markdown code blocks if the AI disobeyed
            const cleanContent = content.replace(/```csv/g, '').replace(/```/g, '').trim();

            parseAndSave(cleanContent);

        } catch (err) {
            if ((err as Error).message.includes("Failed to fetch")) {
                setError("Connection failed. Do you have a valid API key in Settings?");
            } else {
                setError("AI generation failed: " + (err as Error).message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const generateTermsOnly = async () => {
        if (!context.trim()) {
            setError("Please enter a topic in the context field to generate terms (e.g. \"Biology 101\").");
            return;
        }

        const apiKey = apiConfig.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!apiKey && apiConfig.provider === 'openai') {
            setError("Please enter your OpenAI API key in Settings.");
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
                    throw new Error("Invalid API key. Please check your key in Settings.");
                }
                throw new Error(`Generation failed (status: ${response.status}). ${errorText.substring(0, 100)}`);
            }

            const data: ChatCompletionResponse = await response.json();
            const content = data.choices[0].message.content;
            const cleanContent = content.replace(/```csv/g, '').replace(/```/g, '').trim();

            setText(prev => prev ? prev + '\n' + cleanContent : cleanContent);

        } catch (err) {
            if ((err as Error).message.includes("Failed to fetch")) {
                setError("Connection failed. Do you have a valid API key in Settings?");
            } else {
                setError((err as Error).message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const placeholderCSV = `Photosynthesis,The process by which plants convert light energy into chemical energy
DNA,Deoxyribonucleic acid that carries genetic information
Mitosis,Cell division resulting in two identical daughter nuclei`;

    const placeholderAI = `Paste your study notes here! For example:

The Renaissance was a cultural rebirth movement in Europe, originating in 14th-century Italy. Leonardo da Vinci and Michelangelo were the most famous artists of this period.`;

    return (
        <div className="input-container">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <div className="action-bar">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="btn-secondary action-btn"
                        title="AI Settings"
                    >
                        <Settings size={14} />
                        <span className="btn-text">Settings</span>
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
                            AI Generate
                        </span>
                    </label>
                </div>
                {!useAI && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
                        <AlertCircle size={12} />
                        Note: Disabling AI will disable Recall mode and AI distractor generation.
                    </div>
                )}
            </div>

            {showSettings && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1rem',
                    textAlign: 'left'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>AI Settings</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>API Key (stored in browser)</label>
                        <input
                            type="password"
                            value={apiConfig.apiKey}
                            onChange={(e) => updateApiConfig({ apiKey: e.target.value })}
                            placeholder="sk-or-..."
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border)' }}
                        />
                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Your key is stored in the browser and sent directly to the OpenRouter API.
                        </p>
                    </div>

                    <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Model</label>
                        <select
                            value={apiConfig.model}
                            onChange={(e) => updateApiConfig({ model: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border)' }}
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
                        placeholder="Optional context (e.g. &quot;Biology 101&quot;, &quot;Japanese History&quot;)"
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
                        Paste your notes, articles, or summaries below and AI will extract terms for you.
                    </p>
                </div>
            )}

            <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                    <span>Paste your terms below, one per line, separated by comma: <code>Term,Definition</code></span>
                </p>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--error)',
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

            <textarea
                ref={textareaRef}
                className="input-area"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={useAI ? placeholderAI : placeholderCSV}
                disabled={isLoading}
                style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    minHeight: '300px',
                    lineHeight: '1.6',
                    resize: 'vertical'
                }}
            />

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <button
                    className="btn-secondary"
                    onClick={handleClear}
                    style={{ color: 'var(--error)', borderColor: 'var(--error)', padding: '0.5rem 1rem' }}
                    title="Clear all text"
                >
                    <Trash2 size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Clear
                </button>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
                    {useAI && (
                        <button
                            className="btn-secondary"
                            onClick={generateTermsOnly}
                            disabled={isLoading}
                        >
                            Generate Terms
                        </button>
                    )}
                    <button className="btn-primary" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="spin" style={{ marginRight: '0.5rem', verticalAlign: 'middle', animation: 'spin 1s linear infinite' }} />
                                Generating...
                            </>
                        ) : (
                            <>
                                {useAI ? <Sparkles size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> : <Save size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />}
                                {useAI ? "Generate & Start" : "Create Cards"}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {isLoading && useAI && (
                <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    Generating flashcards should take no more than 30 seconds...
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
