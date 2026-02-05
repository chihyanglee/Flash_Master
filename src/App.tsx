import { useState } from 'react';
import InputSection from './components/InputSection';
import StudyDashboard from './components/StudyDashboard';
import { Zap, Github, ArrowLeft } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import type { Flashcard } from './types';

function App() {
  // Try to load from local storage
  const [cards, setCards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem('flashcards');
    return saved ? JSON.parse(saved) : [];
  });

  // AI State
  const [aiEnabled, setAiEnabled] = useState(false);

  const [mode, setMode] = useState<'input' | 'study'>(cards.length > 0 ? 'study' : 'input');

  const handleSaveCards = (newCards: Flashcard[]) => {
    setCards(newCards);
    localStorage.setItem('flashcards', JSON.stringify(newCards));
    setMode('study');
  };

  const handleBack = () => {
    setMode('input');
  };

  return (
    <div className="app-main">
      <header className="app-header">
        {mode === 'study' && (
          <button
            onClick={handleBack}
            className="btn-secondary header-back"
          >
            <ArrowLeft size={14} />
            <span className="back-text">詞彙</span>
          </button>
        )}
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, display: 'inline-block' }}>
            <Zap size={32} style={{ color: '#a855f7', stroke: '#a855f7', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            閃卡大師
          </h1>
          <p className="header-tagline" style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            使用閃卡、測驗、配對和回想模式測試您的記憶力
          </p>
        </div>
        <a
          href="https://github.com/JJsilvera1/CISSP-Quiz"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary header-github"
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

      <footer className="footer">
        <p>&copy; 2025 閃卡大師。為輕鬆學習而打造。作者：Jordan S.</p>
        <a
          href="https://github.com/JJsilvera1/CISSP-Quiz"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary footer-github"
        >
          <Github size={14} />
          <span>GitHub</span>
        </a>
      </footer>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}


export default App;
