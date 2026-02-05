# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm install         # Install dependencies
pnpm dev             # Start dev server (http://localhost:5173)
pnpm build           # Production build (includes type checking)
pnpm preview         # Preview production build
pnpm lint            # Run ESLint
pnpm typecheck       # Run TypeScript type checking
```

Prerequisites: Node.js v18+, pnpm, optional OpenRouter/OpenAI API key for AI features.

## Architecture Overview

FlashMaster is a React 19 + TypeScript + Vite flashcard application with AI-powered features via OpenRouter/OpenAI.

### Tech Stack

- **Language:** TypeScript
- **Framework:** React 19
- **Build Tool:** Vite
- **Package Manager:** pnpm

### Component Structure

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Root component, manages 'input' vs 'study' mode
├── index.css             # Global styles with CSS variables
├── vite-env.d.ts         # Vite environment type declarations
├── types/
│   └── index.ts          # Shared TypeScript type definitions
└── components/
    ├── InputSection.tsx  # Text editor, CSV parsing, AI flashcard generation
    ├── StudyDashboard.tsx # Tab router for study modes
    ├── FlashcardMode.tsx  # 3D flip cards with navigation
    ├── QuizMode.tsx       # Multiple choice + scenario mode (most complex)
    ├── MatchMode.tsx      # Memory matching game (7 pairs)
    └── RecallMode.tsx     # Active recall with AI grading and hints
```

### Type Definitions

Key types defined in `src/types/index.ts`:
- `Flashcard` - { id, term, definition }
- `APIConfig` - { provider, apiKey, model }
- `QuizType` - 'def-to-term' | 'term-to-def' | 'scenario'
- `MatchTile` - { id, cardId, content, type }
- `RecallFeedback` - { score, correct, message }
- `ScenarioData` - { text, options, correctIndex, rationale }

### AI Agent Architecture

The app uses 5 specialized AI agents (detailed in AGENTS.md):

1. **Generator Agent** - Creates flashcards from raw text, outputs CSV format
2. **Grader Agent** - Evaluates recall answers semantically (0-100%), returns JSON
3. **Distractor Agent** - Generates plausible wrong quiz answers from same domain
4. **Hint Agent** - Creates cryptic hints without revealing the answer
5. **Scenario Agent** - Generates situational questions with difficulty scaling

API calls go directly from browser to OpenRouter/OpenAI (no intermediate server).

### State & Storage

localStorage keys:
- `flashcards` - Card data (JSON array)
- `flashcards_input_text` - Editor content
- `flashcards_input_context` - Context field for AI
- `flashcards_api_config` - API provider, key, and model settings

State management uses React useState with prop drilling (no Redux/Context).

### Styling

CSS variables in index.css define the theme:
- `--bg-dark: #0f172a` (slate-900 base)
- `--accent-primary: #8b5cf6` (violet highlights)
- `--accent-gradient` (indigo to violet gradient)

Mobile breakpoint: 640px

### Key Implementation Details

- CSV parsing supports both pipe (`|`) and comma (`,`) delimiters
- Quotes are auto-stripped from terms/definitions
- QuizMode has two question types: definition-to-term and term-to-definition
- Scenario mode uses 3-5 random cards with difficulty levels (Easy/Medium/Hard)
- RecallMode has 3-stage hints: first 3 chars, first 7 chars, then AI-generated hint
- MatchMode uses Fisher-Yates shuffle for unbiased randomization
- Available AI models are defined in InputSection.tsx validModels array (lines 49-56)
