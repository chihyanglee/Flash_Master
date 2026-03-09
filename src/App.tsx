import { useState, useRef } from 'react';
import { Download, Upload, FileDown } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveCards = (newCards: Flashcard[]) => {
    setCards(newCards);
    localStorage.setItem('flashcards', JSON.stringify(newCards));
    setMode('study');
  };

  const handleExportTemplate = () => {
    const template: Flashcard[] = [
      { id: '1', term: 'Photosynthesis', definition: 'The process by which plants convert light energy into chemical energy' },
      { id: '2', term: 'Mitosis', definition: 'Cell division resulting in two identical daughter nuclei' },
      { id: '3', term: 'DNA', definition: 'Deoxyribonucleic acid that carries genetic information' },
    ];
    const data = JSON.stringify(template, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const data = JSON.stringify(cards, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          alert('Invalid file: expected a non-empty JSON array of flashcards.');
          return;
        }
        const valid = parsed.every(
          (c: unknown) =>
            typeof c === 'object' && c !== null &&
            'term' in c && 'definition' in c &&
            typeof (c as Flashcard).term === 'string' &&
            typeof (c as Flashcard).definition === 'string'
        );
        if (!valid) {
          alert('Invalid file: each card must have "term" and "definition" string fields.');
          return;
        }
        const imported: Flashcard[] = parsed.map((c: Flashcard) => ({
          id: c.id || Math.random().toString(36).substr(2, 9),
          term: c.term,
          definition: c.definition,
        }));
        handleSaveCards(imported);
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = '';
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
                Create
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
                Study
              </button>
            </nav>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button
            className="btn-secondary"
            onClick={handleExportTemplate}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Download a sample JSON template"
          >
            <FileDown size={14} />
            Template
          </button>
          <button
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Import cards from JSON"
          >
            <Upload size={14} />
            Import
          </button>
          {cards.length > 0 && (
            <button
              className="btn-secondary"
              onClick={handleExport}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              title="Export cards as JSON"
            >
              <Download size={14} />
              Export
            </button>
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
