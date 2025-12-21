import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, Sparkles, Loader2, Settings } from 'lucide-react';

export default function InputSection({ onSave, onAiEnabledChange, initialAiEnabled }) {
    const [text, setText] = useState('');
    const [context, setContext] = useState('');
    const [error, setError] = useState(null);
    const [useAI, setUseAI] = useState(initialAiEnabled || false);
    const [isLoading, setIsLoading] = useState(false);


    // API Config State
    const [showSettings, setShowSettings] = useState(false);
    const [apiConfig, setApiConfig] = useState(() => {
        const saved = localStorage.getItem('flashcards_api_config');
        return saved ? JSON.parse(saved) : {
            provider: 'openrouter', // 'openrouter' | 'openai'
            apiKey: '',
            model: 'google/gemini-2.0-flash-exp:free'
        };
    });

    const updateApiConfig = (newConfig) => {
        const updated = { ...apiConfig, ...newConfig };
        setApiConfig(updated);
        localStorage.setItem('flashcards_api_config', JSON.stringify(updated));
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

        let updates = {};
        if (apiConfig.provider !== 'openrouter') {
            updates.provider = 'openrouter';
        }
        if (!validModels.includes(apiConfig.model)) {
            updates.model = validModels[0];
        }

        if (Object.keys(updates).length > 0) {
            updateApiConfig(updates);
        }
    }, []);

    const textareaRef = useRef(null);
    const lineNumbersRef = useRef(null);

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
            setError(err.message);
        }
    };

    const parseAndSave = (inputText) => {
        try {
            const lines = inputText.trim().split('\n');
            const cards = [];
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
                    throw new Error(`Line ${index + 1} is missing a separator (| or ,): "${line}"`);
                }

                const clean = (s) => s.trim().replace(/^(['"])(.*)\1$/, '$2');
                const term = clean(line.substring(0, splitIndex));
                const definition = clean(line.substring(splitIndex + 1));

                if (!term || !definition) {
                    throw new Error(`Line ${index + 1} has empty term or definition.`);
                }
                cards.push({ id: Math.random().toString(36).substr(2, 9), term, definition });
            });

            if (cards.length === 0) {
                throw new Error("No valid cards found.");
            }

            onSave(cards);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const generateFlashcards = async () => {
        if (!text.trim()) {
            setError("Please enter some text to generate cards from.");

            return;
        }

        const apiKey = apiConfig.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
        // If still no key and using OpenAI, error. OpenRouter might use free env key.
        if (!apiKey && apiConfig.provider === 'openai') {
            setError("Please enter your OpenAI API Key in settings.");
            setShowSettings(true);
            return;
        }

        // Determine URL and Headers based on provider
        let url, headers, body;

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
                let message = "Failed to fetch";
                try {
                    const errData = JSON.parse(errorText);
                    message = errData.error?.message || message;
                } catch (e) { /* ignore */ }

                if (response.status === 401) {
                    throw new Error("Invalid API Key. Please check your key in Settings.");
                }
                throw new Error(`${message} (Status: ${response.status})`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Clean up potential markdown code blocks if the AI disobeyed
            const cleanContent = content.replace(/```csv/g, '').replace(/```/g, '').trim();

            parseAndSave(cleanContent);

        } catch (err) {
            if (err.message.includes("Failed to fetch")) {
                setError("Connection Failed. Do you have a valid API Key in Settings?");
            } else {
                setError("AI Generation Failed: " + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };


    const generateTermsOnly = async () => {
        if (!context.trim()) {
            setError("Please enter a topic in the Optional Context box to generate terms (e.g. 'CISSP Domain 1').");
            return;
        }

        const apiKey = apiConfig.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!apiKey && apiConfig.provider === 'openai') {
            setError("Please enter your OpenAI API Key in settings.");
            setShowSettings(true);
            return;
        }

        setIsLoading(true);
        setError(null);
        setError(null);

        let url, headers, body;
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
                    throw new Error("Invalid API Key. Please check your key in Settings.");
                }
                throw new Error(`Generation failed (Status: ${response.status}). ${errorText.substring(0, 100)}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            const cleanContent = content.replace(/```csv/g, '').replace(/```/g, '').trim();

            setText(cleanContent);

        } catch (err) {
            if (err.message.includes("Failed to fetch")) {
                setError("Connection Failed. Do you have a valid API Key in Settings?");
            } else {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const placeholderCSV = `CIA Triad,Confidentiality Integrity Availability
AES,Advanced Encryption Standard
Two-Factor,Something you know plus something you have

---
Welcome to FlashMaster! ⚡

1. Manual Mode (This Screen):
   - Simply enter your terms and definitions above, comma separated.
   - Hit "Create Flashcards" to play without AI.

2. AI Power Mode 🤖:
   - Toggle "Use AI Generation" above.
   - Fill in the "Optional Context" (e.g., "Biology Ch 1").
   - Paste raw notes or click "Generate Terms" to get ~50-100 cards instantly.
   - Enabling AI also unlocks RECALL MODE - the ultimate memory test where you type answers manually!`;

    const placeholderAI = `Paste your study notes here! For example:

Security models are critical for CISSP. The Bell-LaPadula model focuses on confidentiality and has the 'No Read Up, No Write Down' rule. Biba, on the other hand, focuses on integrity.`;

    return (
        <div className="input-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="btn-secondary"
                        style={{ padding: '0.375rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                        title="AI Settings"
                    >
                        <Settings size={14} color="white" />
                        <span style={{ fontSize: '0.75rem' }}>Settings</span>
                    </button>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        cursor: 'pointer',
                        background: useAI ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-card)',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: useAI ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="checkbox"
                            checked={useAI}
                            onChange={(e) => {
                                const newValue = e.target.checked;
                                setUseAI(newValue);
                                if (onAiEnabledChange) onAiEnabledChange(newValue);
                            }}
                            style={{ accentColor: 'var(--accent-primary)' }}
                        />
                        <Sparkles size={12} color={useAI ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                        <span style={{ color: useAI ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 500, fontSize: '0.75rem' }}>
                            Use AI Generation
                        </span>
                    </label>
                </div>
                {!useAI && (
                    <div style={{ fontSize: '0.7rem', color: 'orange', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
                        <AlertCircle size={12} />
                        Note: Disabling AI will disable Recall Mode and distractor generation.
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
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>AI Configuration</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>API Key (Stored in Browser)</label>
                        <input
                            type="password"
                            value={apiConfig.apiKey}
                            onChange={(e) => updateApiConfig({ apiKey: e.target.value })}
                            placeholder="sk-or-..."
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', background: '#0f172a', color: 'white', border: '1px solid var(--border)' }}
                        />
                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Your key is stored locally in your browser and sent directly to the OpenRouter API.
                        </p>
                    </div>

                    <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Model</label>
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
                        placeholder="Optional Context (e.g. 'CISSP Domain 1', 'Biology 101')"
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
                        Paste your raw notes, article, or summary below. AI will extract the terms for you.
                    </p>
                </div>
            )}

            <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                    <span>Paste your terms below one per line with comma separation: <code>TERM,DEFINITION</code></span>
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

            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                <button className="btn-primary" onClick={handleSave} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 size={18} className="spin" style={{ marginRight: '0.5rem', verticalAlign: 'middle', animation: 'spin 1s linear infinite' }} />
                            Generating...
                        </>
                    ) : (
                        <>
                            {useAI ? <Sparkles size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> : <Save size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />}
                            {useAI ? "Generate & Play" : "Create Flashcards"}
                        </>
                    )}
                </button>
                {useAI && (
                    <button
                        className="btn-secondary"
                        onClick={generateTermsOnly}
                        disabled={isLoading}
                        style={{ marginLeft: '1rem' }}
                    >
                        Generate Terms
                    </button>
                )}
            </div>

            {isLoading && useAI && (
                <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    Should take less than 30 seconds to generate all flashcards, depending on how many were added...
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
