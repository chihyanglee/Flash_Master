import { useState } from 'react';
import InputSection from './components/InputSection';
import StudyDashboard from './components/StudyDashboard';
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

  return (
    <div className="app-main">
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 0',
        borderBottom: '1px solid var(--border)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            FlashMaster
          </h1>
          {cards.length > 0 && (
            <nav style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setMode('input')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: mode === 'input' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.9rem', fontWeight: mode === 'input' ? '600' : '400',
                  borderBottom: mode === 'input' ? '2px solid var(--accent)' : '2px solid transparent',
                  padding: '0.25rem 0', fontFamily: 'inherit'
                }}
              >
                建立
              </button>
              <button
                onClick={() => setMode('study')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: mode === 'study' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.9rem', fontWeight: mode === 'study' ? '600' : '400',
                  borderBottom: mode === 'study' ? '2px solid var(--accent)' : '2px solid transparent',
                  padding: '0.25rem 0', fontFamily: 'inherit'
                }}
              >
                學習
              </button>
            </nav>
          )}
        </div>
      </header>

      <main>
        {mode === 'input' ? (
          <InputSection onSave={handleSaveCards} onAiEnabledChange={setAiEnabled} initialAiEnabled={aiEnabled} />
        ) : (
          <StudyDashboard cards={cards} aiEnabled={aiEnabled} />
        )}
      </main>

      <footer className="footer">
        <p>&copy; 2025 FlashMaster</p>
      </footer>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}


export default App;
