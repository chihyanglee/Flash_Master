import { useState } from 'react';
import { BookOpen, HelpCircle, Brain } from 'lucide-react';
import FlashcardMode from './FlashcardMode';
import QuizMode from './QuizMode';
import RecallMode from './RecallMode';
import type { StudyDashboardProps } from '../types';

type TabType = 'study' | 'quiz' | 'recall';

export default function StudyDashboard({ cards, aiEnabled }: StudyDashboardProps) {
    const [activeTab, setActiveTab] = useState<TabType>('study');

    return (
        <div>


            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'study' ? 'active' : ''}`}
                    onClick={() => setActiveTab('study')}
                >
                    <BookOpen size={18} />
                    <span>Cards</span>
                </button>
                <button
                    className={`tab ${activeTab === 'quiz' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quiz')}
                >
                    <HelpCircle size={18} />
                    <span>Quiz</span>
                </button>
                <button
                    className={`tab ${activeTab === 'recall' ? 'active' : ''}`}
                    onClick={() => aiEnabled && setActiveTab('recall')}
                    disabled={!aiEnabled}
                    title={!aiEnabled ? "Enable AI in the input section to use Recall mode" : "Recall mode"}
                    style={{ opacity: !aiEnabled ? 0.5 : 1, cursor: !aiEnabled ? 'not-allowed' : 'pointer' }}
                >
                    <Brain size={18} />
                    <span>Recall</span>
                </button>
            </div>

            {activeTab === 'study' && <FlashcardMode cards={cards} />}
            {activeTab === 'quiz' && <QuizMode cards={cards} />}
            {activeTab === 'recall' && <RecallMode cards={cards} />}
        </div >
    );
}
