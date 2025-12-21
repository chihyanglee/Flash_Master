import React, { useState, useEffect } from 'react';
import InputSection from './components/InputSection';
import StudyDashboard from './components/StudyDashboard';
import { Zap, Github } from 'lucide-react';



function App() {
  // Try to load from local storage
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('flashcards');
    return saved ? JSON.parse(saved) : [];
  });

  // AI State
  const [aiEnabled, setAiEnabled] = useState(false);

  const [mode, setMode] = useState(cards.length > 0 ? 'study' : 'input');

  const handleSaveCards = (newCards) => {
    setCards(newCards);
    localStorage.setItem('flashcards', JSON.stringify(newCards));
    setMode('study');
  };

  const handleBack = () => {
    setMode('input');
  };

  return (
    <div style={{ minHeight: '100vh', padding: '1rem' }}>
      <header style={{ marginBottom: '3rem', marginTop: '1rem', position: 'relative', textAlign: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, display: 'inline-block' }}>
            <Zap size={32} style={{ color: '#a855f7', stroke: '#a855f7', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            FlashMaster
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Test your memory with flashcards, quizzes, matching, and recall modes.
          </p>
        </div>
        <a
          href="https://github.com/JJsilvera1/CISSP-Quiz"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            textDecoration: 'none',
            color: 'white',
            padding: '0.3rem 0.6rem',
            fontSize: '0.6rem'
          }}
        >
          <Github size={14} />
          <span>GitHub</span>
        </a>
      </header>

      <main>
        {mode === 'input' ? (
          <InputSection onSave={handleSaveCards} onAiEnabledChange={setAiEnabled} initialAiEnabled={aiEnabled} />
        ) : (
          <StudyDashboard cards={cards} onBack={handleBack} aiEnabled={aiEnabled} />
        )}
      </main>

      <footer style={{ marginTop: '4rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        &copy; 2025 FlashMaster. Built for effortless and easy learning. Created by: Jordan S.
      </footer>
    </div>
  );
}


export default App;
