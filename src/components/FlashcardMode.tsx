import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Shuffle } from 'lucide-react';
import type { FlashcardModeProps, Flashcard } from '../types';

export default function FlashcardMode({ cards: rawCards }: FlashcardModeProps) {
    const clean = (s: string | undefined): string => (s && typeof s === 'string') ? s.trim().replace(/^(['"])(.*)\1$/, '$2') : '';
    const cards: Flashcard[] = rawCards ? rawCards.map(c => ({ ...c, term: clean(c.term), definition: clean(c.definition) })) : [];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [deck, setDeck] = useState<Flashcard[]>(cards);

    const currentCard = deck[currentIndex];

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % deck.length);
        }, 200);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
        }, 200);
    };

    const handleShuffle = () => {
        setDeck([...deck].sort(() => Math.random() - 0.5));
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                    第 {currentIndex + 1} 張 / 共 {deck.length} 張
                </span>
                <button className="btn-secondary" onClick={handleShuffle} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                    <Shuffle size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    洗牌
                </button>
            </div>

            <div
                className={`flashcard-container ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className="flashcard-inner">
                    <div className="flashcard-front">
                        {currentCard?.term}
                        <span style={{
                            position: 'absolute',
                            bottom: '1rem',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            opacity: 0.5
                        }}>
                            點擊翻轉
                        </span>
                    </div>
                    <div className="flashcard-back">
                        {currentCard?.definition}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button className="btn-secondary" onClick={handlePrev}>
                    <ChevronLeft size={24} />
                </button>
                <button className="btn-secondary" onClick={() => setIsFlipped(!isFlipped)}>
                    <RotateCw size={24} />
                </button>
                <button className="btn-secondary" onClick={handleNext}>
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
}
