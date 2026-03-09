# FlashMaster

A minimal, AI-powered flashcard app for studying any subject. Features smart content generation, adaptive quizzes, and active recall with AI grading.

## Features

### Input & Generation
- **AI-Powered Creation**: Extract terms and definitions from raw notes or articles
- **Smart Context**: Add topic context to guide AI generation
- **CSV Support**: Outputs clean `Term,Definition` format with pipe (`|`) and comma (`,`) delimiter support
- **Local API Key**: Stored in browser localStorage, never sent to any server

### Study Modes

**Flashcards** — 3D flip cards with shuffle and keyboard navigation

**Quiz Mode**
- AI-generated plausible distractors from the same domain
- Scenario mode: situational questions from 3-5 random cards with difficulty scaling (Easy/Medium/Hard)
- In-place rationale explaining why the answer is correct
- Auto-advance for speed flow

**Recall Mode** (requires AI)
- Type answers manually for active recall
- Progressive 3-stage hints: first 3 chars, first 7 chars, then AI-generated clue
- AI grading scores answers 0-100% based on semantic similarity
- Shuffled deck ensures every card appears before repeats

## Getting Started

### Prerequisites
- Node.js v18+
- pnpm
- API key from [OpenRouter](https://openrouter.ai/) or OpenAI (optional, required for AI features)

### Installation

```bash
git clone <repo-url> && cd Flash_Master
pnpm install
pnpm dev
```

Open `http://localhost:5173`, then configure your API key in the Settings panel.

## Tech Stack

- React 19 + TypeScript + Vite
- OpenRouter / OpenAI API
- Lucide React icons
- CSS custom properties with monochrome + teal accent theme
