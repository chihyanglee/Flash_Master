// Core data types
export interface Flashcard {
  id: string;
  term: string;
  definition: string;
}

// API configuration types
export type APIProvider = 'openrouter' | 'openai';

export interface APIConfig {
  provider: APIProvider;
  apiKey: string;
  model: string;
}

// Quiz types
export type QuizType = 'def-to-term' | 'term-to-def' | 'scenario';

export type RecallMode = 'def-to-term' | 'term-to-def';

// Match mode types
export interface MatchTile {
  id: string;
  cardId: string;
  content: string;
  type: 'term' | 'def';
}

// Recall mode types
export interface RecallFeedback {
  score: number;
  correct: boolean;
  message: string;
}

// Scenario mode types
export interface ScenarioData {
  text: string;
  options: string[];
  correctIndex: number;
  rationale: string;
}

// Quiz option types
export interface QuizOption {
  id: string;
  term: string;
  definition: string;
  label: string;
  isDistractor?: boolean;
  isCorrect?: boolean;
}

// Quiz history entry
export interface QuizHistoryEntry {
  term: string;
  definition: string;
  questionType: QuizType;
  answeredCorrectly: boolean;
  userAnswer: string;
}

// Component props interfaces
export interface InputSectionProps {
  onSave: (cards: Flashcard[]) => void;
  onAiEnabledChange?: (enabled: boolean) => void;
  initialAiEnabled?: boolean;
}

export interface StudyDashboardProps {
  cards: Flashcard[];
  onBack: () => void;
  aiEnabled: boolean;
}

export interface FlashcardModeProps {
  cards: Flashcard[];
}

export interface QuizModeProps {
  cards: Flashcard[];
}

export interface MatchModeProps {
  cards: Flashcard[];
}

export interface RecallModeProps {
  cards: Flashcard[];
}

// API response types
export interface ChatCompletionMessage {
  role: string;
  content: string;
}

export interface ChatCompletionChoice {
  message: ChatCompletionMessage;
}

export interface ChatCompletionResponse {
  choices: ChatCompletionChoice[];
}
