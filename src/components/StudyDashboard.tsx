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
                    <span>閃卡</span>
                </button>
                <button
                    className={`tab ${activeTab === 'quiz' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quiz')}
                >
                    <HelpCircle size={18} />
                    <span>測驗</span>
                </button>
                <button
                    className={`tab ${activeTab === 'recall' ? 'active' : ''}`}
                    onClick={() => aiEnabled && setActiveTab('recall')}
                    disabled={!aiEnabled}
                    title={!aiEnabled ? "在輸入區啟用 AI 以使用回想模式" : "回想模式"}
                    style={{ opacity: !aiEnabled ? 0.5 : 1, cursor: !aiEnabled ? 'not-allowed' : 'pointer' }}
                >
                    <Brain size={18} />
                    <span>回想</span>
                </button>
            </div>

            {activeTab === 'study' && <FlashcardMode cards={cards} />}
            {activeTab === 'quiz' && <QuizMode cards={cards} />}
            {activeTab === 'recall' && <RecallMode cards={cards} />}
        </div >
    );
}
