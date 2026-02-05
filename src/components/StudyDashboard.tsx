import { useState } from 'react';
import { BookOpen, HelpCircle, Grid, Brain, ArrowLeft } from 'lucide-react';
import FlashcardMode from './FlashcardMode';
import QuizMode from './QuizMode';
import MatchMode from './MatchMode';
import RecallMode from './RecallMode';
import type { StudyDashboardProps } from '../types';

type TabType = 'study' | 'quiz' | 'match' | 'recall';

export default function StudyDashboard({ cards, onBack, aiEnabled }: StudyDashboardProps) {
    const [activeTab, setActiveTab] = useState<TabType>('study');

    return (
        <div>


            <div className="tabs">
                <button
                    className="tab mobile-only-tab"
                    onClick={onBack}
                >
                    <ArrowLeft size={18} />
                    <span>詞彙</span>
                </button>
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
                    className={`tab ${activeTab === 'match' ? 'active' : ''}`}
                    onClick={() => setActiveTab('match')}
                >
                    <Grid size={18} />
                    <span>配對</span>
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
            {activeTab === 'match' && <MatchMode cards={cards} />}
            {activeTab === 'recall' && <RecallMode cards={cards} />}
        </div >
    );
}
