import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, ArrowRight, Lightbulb, CheckCircle2, XCircle, ArrowLeftRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function RecallMode({ cards }) {
    // State
    const [currentCard, setCurrentCard] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [isFlipped, setIsFlipped] = useState(false); // Flipped = Term is question, Def is answer (or vice versa)
    const [mode, setMode] = useState('def-to-term'); // 'def-to-term' | 'term-to-def'

    // Grading State
    const [isGrading, setIsGrading] = useState(false);
    const [feedback, setFeedback] = useState(null); // { score: number, message: string, correct: boolean }
    const [hintLevel, setHintLevel] = useState(0); // 0 = None, 1 = 3 Chars, 2 = 7 Chars, 3 = AI Hint
    const [aiHint, setAiHint] = useState(null);
    const [loadingHint, setLoadingHint] = useState(false);

    // Stats
    const [scoreHistory, setScoreHistory] = useState([]); // Array of previous scores

    // Queue State
    const [queue, setQueue] = useState([]);

    const generateQuestion = () => {
        if (!cards || cards.length === 0) return;

        let currentQueue = [...queue];

        if (currentQueue.length === 0) {
            // Create and shuffle new queue
            currentQueue = Array.from({ length: cards.length }, (_, i) => i);
            for (let i = currentQueue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentQueue[i], currentQueue[j]] = [currentQueue[j], currentQueue[i]];
            }
        }

        const nextIndex = currentQueue.pop();
        setQueue(currentQueue);

        const nextCard = cards[nextIndex];
        setCurrentCard(nextCard);

        setUserAnswer('');
        setFeedback(null);
        setHintLevel(0);
        setAiHint(null);
    };

    useEffect(() => {
        generateQuestion();
    }, []);

    const fetchAIHint = async () => {
        setLoadingHint(true);
        try {
            const savedConfig = localStorage.getItem('flashcards_api_config');
            const apiConfig = savedConfig ? JSON.parse(savedConfig) : {
                provider: 'openrouter',
                apiKey: '',
                model: 'google/gemini-2.0-flash-exp:free'
            };
            const apiKey = apiConfig.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;

            if (!apiKey) throw new Error("No API Key");

            const answer = mode === 'def-to-term' ? currentCard.term : currentCard.definition;
            const context = mode === 'def-to-term' ? currentCard.definition : currentCard.term;

            const prompt = `Give a cryptic, vague, but helpful hint for the answer: "${answer}". The question/context is: "${context}". Do NOT reveal the answer word itself. It should guide the user to the answer without giving it away directly. Max 15 words.`;

            let url, headers, body;
            if (apiConfig.provider === 'openai') {
                url = "https://api.openai.com/v1/chat/completions";
                headers = { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" };
                body = { model: apiConfig.model, messages: [{ role: "user", content: prompt }] };
            } else {
                url = "https://openrouter.ai/api/v1/chat/completions";
                headers = {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "FlashMaster",
                    "Content-Type": "application/json"
                };
                body = { model: apiConfig.model, messages: [{ role: "user", content: prompt }] };
            }

            let response;
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
                    if (response.ok) break;
                    // If 4xx, do not retry
                    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                        throw new Error(`Client Error: ${response.status}`);
                    }
                    throw new Error(`Server Error: ${response.status}`);
                } catch (e) {
                    attempts++;
                    if (attempts >= maxAttempts) throw e;
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            const data = await response.json();
            setAiHint(data.choices[0].message.content);
        } catch (err) {
            setAiHint("Could not generate hint.");
        } finally {
            setLoadingHint(false);
        }
    };

    const handleHint = () => {
        if (hintLevel === 0) {
            setHintLevel(1);
        } else if (hintLevel === 1) {
            setHintLevel(2);
        } else if (hintLevel === 2) {
            setHintLevel(3);
            fetchAIHint();
        }
    };

    const handleSubmit = async () => {
        // Allow empty submission -> immediate fail
        if (!userAnswer.trim()) {
            setFeedback({ score: 0, correct: false, message: "No answer provided." });
            setScoreHistory(prev => [...prev, 0]);
            return;
        }

        setIsGrading(true);
        try {
            const savedConfig = localStorage.getItem('flashcards_api_config');
            const apiConfig = savedConfig ? JSON.parse(savedConfig) : {
                provider: 'openrouter',
                apiKey: '',
                model: 'google/gemini-2.0-flash-exp:free'
            };
            const apiKey = apiConfig.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
            if (!apiKey) throw new Error("Missing API Key");

            const correctAnswer = mode === 'def-to-term' ? currentCard.term : currentCard.definition;
            const questionText = mode === 'def-to-term' ? currentCard.definition : currentCard.term;

            let url, headers, body;
            // ... (keep existing API logic)
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
                            "role": "system",
                            "content": "You are a strict study grader. Compare the User Answer to the Correct Answer. Give a similarity score (0-100). If score > 80, mark as CORRECT. Provide brief 1-sentence feedback. Format output as JSON: { \"score\": number, \"correct\": boolean, \"message\": \"string\" }"
                        },
                        {
                            "role": "user",
                            "content": `Question: ${questionText}\nCorrect Answer: ${correctAnswer}\nUser Answer: ${userAnswer}`
                        }
                    ]
                };
            } else {
                url = "https://openrouter.ai/api/v1/chat/completions";
                headers = {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "FlashMaster",
                    "Content-Type": "application/json"
                };
                body = {
                    model: apiConfig.model,
                    messages: [
                        {
                            "role": "system",
                            "content": "You are a strict study grader. Compare the User Answer to the Correct Answer. Give a similarity score (0-100). If score > 80, mark as CORRECT. Provide brief 1-sentence feedback. Format output as JSON: { \"score\": number, \"correct\": boolean, \"message\": \"string\" }"
                        },
                        {
                            "role": "user",
                            "content": `Question: ${questionText}\nCorrect Answer: ${correctAnswer}\nUser Answer: ${userAnswer}`
                        }
                    ]
                };
            }

            let result;
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });

                    if (!response.ok) {
                        // If 4xx (client error), don't retry, just throw
                        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                            throw new Error(`Client Error: ${response.status}`);
                        }
                        throw new Error(`Server Error: ${response.status}`);
                    }

                    const data = await response.json();

                    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                        throw new Error("Invalid AI Response Structure");
                    }

                    const content = data.choices[0].message.content;
                    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();

                    result = JSON.parse(jsonStr);

                    // Validate Result
                    if (typeof result.score !== 'number') throw new Error("Missing score in response");

                    break; // Success!

                } catch (e) {
                    attempts++;
                    console.warn(`Grading attempt ${attempts} failed: ${e.message}`);
                    if (attempts >= maxAttempts) throw e;
                    // Wait 1s before retry
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            setFeedback(result);
            setScoreHistory(prev => [...prev, result.score]);

        } catch (err) {
            console.error(err);
            setFeedback({ score: 0, correct: false, message: "Error grading answer. Please try again." });
        } finally {
            setIsGrading(false);
        }
    };

    const getHintText = () => {
        const answer = mode === 'def-to-term' ? currentCard.term : currentCard.definition;
        if (hintLevel === 1) return answer.substring(0, 3) + "...";
        if (hintLevel === 2) return answer.substring(0, 7) + "...";
        if (hintLevel === 3) return loadingHint ? "Thinking..." : aiHint;
        return "";
    };

    if (!currentCard) return <div style={{ padding: '2rem' }}>Loading Deck...</div>;

    const questionText = mode === 'def-to-term' ? currentCard.definition : currentCard.term;
    const avgScore = scoreHistory.length > 0 ? Math.round(scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length) : 0;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>

            {/* Stats Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <div>Avg Match: <strong style={{ color: avgScore > 80 ? 'var(--success)' : 'var(--text-primary)' }}>{avgScore}%</strong></div>
                <button
                    className="btn-secondary"
                    onClick={() => setMode(m => m === 'def-to-term' ? 'term-to-def' : 'def-to-term')}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    title="Switch Recall Direction"
                >
                    <ArrowLeftRight size={14} />
                    {mode === 'def-to-term' ? "Recall: Terms" : "Recall: Definitions"}
                </button>
            </div>

            {/* Question Card */}
            {/* Question Card */}
            <div className="recall-card">
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-primary)', marginBottom: '1rem' }}>
                    {mode === 'def-to-term' ? "Definition" : "Term"}
                </span>
                <div style={{ fontSize: '1.25rem', whiteSpace: 'pre-wrap' }}>
                    {questionText}
                </div>
            </div>

            {/* Input Area */}
            <div style={{ marginBottom: '2rem' }}>
                <input
                    type="text"
                    className="input-area"
                    style={{
                        width: '100%',
                        padding: '1rem',
                        marginBottom: '1rem',
                        fontSize: '1.1rem',
                        minHeight: 'unset',
                        height: 'auto',
                        whiteSpace: 'pre-wrap',
                        boxSizing: 'border-box'
                    }}
                    placeholder={mode === 'def-to-term' ? "Type the term..." : "Type the definition..."}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={!!feedback || isGrading}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!feedback && !isGrading) handleSubmit();
                        }
                    }}
                />

                {!feedback && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                                className="btn-secondary"
                                onClick={handleHint}
                                disabled={hintLevel >= 3}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: hintLevel >= 3 ? 0.5 : 1 }}
                            >
                                <Lightbulb size={16} />
                                {hintLevel === 0 ? "Show Hint" : hintLevel === 1 ? "More Hint" : "Max Hint"}
                            </button>

                            {hintLevel >= 1 && (
                                <span style={{ color: 'var(--accent-primary)', fontStyle: 'italic', animation: 'fadeIn 0.3s', maxWidth: '200px', textAlign: 'left', fontSize: '0.9rem' }}>
                                    {getHintText()}
                                </span>
                            )}
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={isGrading}
                            style={{ minWidth: '120px' }}
                        >
                            {isGrading ? <Loader2 className="spin" size={20} /> : (userAnswer.trim() ? "Submit" : "I Don't Know")}
                        </button>
                    </div>
                )}
            </div>

            {/* AI Grading Feedback */}
            {feedback && (
                <div style={{
                    background: feedback.correct ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${feedback.correct ? 'var(--success)' : 'var(--error)'}`,
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    textAlign: 'left',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: feedback.correct ? 'var(--success)' : 'var(--error)' }}>
                            {feedback.correct ? <CheckCircle2 /> : <XCircle />}
                            {feedback.correct ? "Correct!" : "Nice Try"}
                        </h3>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{feedback.score}% Match</span>
                    </div>

                    <p style={{ marginBottom: '1rem' }}>{feedback.message}</p>

                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                        <strong>Correct Answer:</strong> {mode === 'def-to-term' ? currentCard.term : currentCard.definition}
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
                        <button className="btn-primary" onClick={generateQuestion}>
                            Next Question <ArrowRight size={18} style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }} />
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
