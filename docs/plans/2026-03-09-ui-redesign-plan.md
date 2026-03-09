# FlashMaster UI Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform FlashMaster from a CISSP-branded app into a general-purpose, monochrome flashcard tool with teal accent and spacious minimal design.

**Architecture:** Pure CSS/component refactor — no new dependencies, no structural changes to state management or AI logic. Remove MatchMode, update color system, simplify layouts, rebrand away from CISSP.

**Tech Stack:** React 19, TypeScript, Vite, CSS3 (no Tailwind)

---

### Task 1: Update color system and global styles in index.css

**Files:**
- Modify: `src/index.css`

**Step 1: Replace CSS variables (lines 1-13)**

Replace the `:root` block with the new monochrome + teal palette:

```css
:root {
  --bg-primary: #0a0a0a;
  --bg-card: #141414;
  --bg-hover: #1a1a1a;
  --text-primary: #fafafa;
  --text-secondary: #737373;
  --text-muted: #525252;
  --accent: #5eead4;
  --accent-hover: #2dd4bf;
  --accent-subtle: rgba(94, 234, 212, 0.1);
  --success: #4ade80;
  --error: #f87171;
  --border: #262626;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

**Step 2: Update body styles**

Change `background-color: var(--bg-dark)` → `background-color: var(--bg-primary)`.

**Step 3: Update #root**

Change `max-width: 1200px` → `max-width: 800px`, change `padding: 2rem` → `padding: 1.5rem`, add `text-align: left`.

**Step 4: Update .btn-primary**

Replace gradient background with solid teal:

```css
.btn-primary {
  background: var(--accent);
  color: #0a0a0a;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  box-shadow: none;
}

.btn-primary:hover {
  background: var(--accent-hover);
  opacity: 1;
  transform: none;
}
```

**Step 5: Update .btn-secondary**

```css
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
}

.btn-secondary:hover {
  background: var(--bg-hover);
}
```

**Step 6: Update .input-area**

Replace `var(--bg-card)` → `var(--bg-card)` (same), replace focus outline from `var(--accent-primary)` → `var(--accent)`.

**Step 7: Update flashcard styles**

- `.flashcard-front`: keep `font-size: 2rem`, change `font-weight: 700` → `600`
- `.flashcard-back`: replace `background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%)` → `background: var(--bg-card)`
- `.flashcard-container`: change `height: 350px` → `height: 300px`, change transition from `0.6s` → `0.4s`
- All flashcard `box-shadow` → `none`

**Step 8: Remove all match game CSS**

Delete everything from `.match-grid` through the `.match-card.errors` animation (lines 167-233 approx). Also delete the `.match-card.matched` mobile override.

**Step 9: Update .tabs**

```css
.tabs {
  display: flex;
  justify-content: flex-start;
  gap: 2rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
}

.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: 0.75rem 0;
  border-radius: 0;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
}

.tab.active {
  background: transparent;
  color: var(--text-primary);
  font-weight: 600;
  border-bottom-color: var(--accent);
}
```

**Step 10: Update quiz option styles**

Change `.quiz-options-grid` from 2-column to single column:

```css
.quiz-options-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
```

Update `.quiz-option`:

```css
.quiz-option {
  display: block;
  width: 100%;
  text-align: left;
  padding: 1rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  color: var(--text-primary);
  font-size: 1rem;
  word-break: break-word;
  overflow-wrap: break-word;
  transition: background 0.15s, border-color 0.15s;
}

.quiz-option:hover {
  background: var(--bg-hover);
}

.quiz-option.correct {
  border-left: 3px solid var(--success);
  background: rgba(74, 222, 128, 0.05);
  border-color: var(--success);
}

.quiz-option.wrong {
  border-left: 3px solid var(--error);
  background: rgba(248, 113, 113, 0.05);
  border-color: var(--error);
}
```

**Step 11: Update remaining hardcoded colors**

- Replace all `#334155` → `var(--border)` or `var(--bg-hover)`
- Replace all `rgba(139, 92, 246, ...)` → `var(--accent-subtle)` or `var(--accent)`
- Replace all `var(--accent-primary)` → `var(--accent)`
- Replace all `var(--bg-dark)` → `var(--bg-primary)`

**Step 12: Update .ai-toggle.active**

```css
.ai-toggle.active {
  background: var(--accent-subtle);
  border-color: var(--accent);
}

.ai-toggle input {
  accent-color: var(--accent);
}

.ai-toggle.active .ai-icon,
.ai-toggle.active .ai-label {
  color: var(--accent);
}
```

**Step 13: Update .quiz-card**

Remove `box-shadow`, keep `background: var(--bg-card)`, `border: 1px solid var(--border)`, `border-radius: 0.75rem`.

**Step 14: Update .recall-card**

Remove `box-shadow`. Keep structure, update `border-radius: 0.75rem`.

**Step 15: Update markdown content heading colors**

`.markdown-content h1, h2, h3` → `color: var(--text-primary)` (was `var(--accent-primary)`)
`.markdown-content strong` → `color: var(--accent)` (was `var(--success)`)

**Step 16: Update mobile tab styles**

```css
@media (max-width: 640px) {
  .tabs {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    margin-bottom: 0;
    padding: 0.5rem 0;
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    border-bottom: none;
    z-index: 100;
    justify-content: space-evenly;
    gap: 0;
  }

  .tab {
    flex-direction: column;
    padding: 0.5rem;
    font-size: 0.75rem;
    border: none;
    border-bottom: none;
    gap: 0.25rem;
  }

  .tab.active {
    color: var(--accent);
    background: transparent;
    border-bottom: none;
  }

  .app-main {
    padding-bottom: 72px !important;
  }
}
```

**Step 17: Update footer**

Change `border-top: 1px solid var(--border)` (already correct with new variable).

**Step 18: Remove `.mobile-only-tab` default `display: none`**

This CSS class will no longer be needed after removing Match mode (3 tabs only, all visible).

**Step 19: Commit**

```bash
git add src/index.css
git commit -m "refactor: replace color system with monochrome + teal theme, remove match CSS"
```

---

### Task 2: Update App.tsx — header, footer, rebranding

**Files:**
- Modify: `src/App.tsx`

**Step 1: Simplify header**

Replace the entire header with a minimal wordmark design. Remove `Zap` icon import, remove `Github` import, remove gradient inline styles. Replace with:

```tsx
<header className="app-header" style={{
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
```

**Step 2: Remove the `header-back` button** (navigation is now in the header nav)

**Step 3: Remove the `header-github` link**

**Step 4: Simplify footer**

Replace footer content, remove GitHub link and CISSP references:

```tsx
<footer className="footer">
  <p>&copy; 2025 FlashMaster</p>
</footer>
```

**Step 5: Remove `handleBack` function** — no longer needed since mode switching is in header nav. Remove `onBack` prop from `StudyDashboard`.

**Step 6: Clean up imports**

Remove `Zap`, `Github`, `ArrowLeft` from lucide-react imports.

**Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: simplify header to minimal wordmark with inline nav, remove CISSP branding"
```

---

### Task 3: Update StudyDashboard — remove MatchMode, simplify tabs

**Files:**
- Modify: `src/components/StudyDashboard.tsx`

**Step 1: Remove MatchMode**

- Remove `import MatchMode from './MatchMode'`
- Remove `Grid` from lucide imports
- Remove `ArrowLeft` from lucide imports
- Change `TabType` to `'study' | 'quiz' | 'recall'` (remove `'match'`)
- Remove the match tab button entirely
- Remove `{activeTab === 'match' && <MatchMode cards={cards} />}`
- Remove the mobile-only back button (first `<button>` in tabs)

**Step 2: Remove `onBack` prop usage**

Update the component signature to remove `onBack`:

```tsx
export default function StudyDashboard({ cards, aiEnabled }: Omit<StudyDashboardProps, 'onBack'>) {
```

Or better: update the `StudyDashboardProps` type in types/index.ts to make `onBack` optional, then just don't use it.

**Step 3: Commit**

```bash
git add src/components/StudyDashboard.tsx
git commit -m "refactor: remove MatchMode tab, simplify study navigation"
```

---

### Task 4: Update types — remove MatchMode types, update props

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Remove `MatchTile` interface** (lines 23-28)

**Step 2: Remove `MatchModeProps` interface** (lines 85-87)

**Step 3: Make `onBack` optional in `StudyDashboardProps`**

```ts
export interface StudyDashboardProps {
  cards: Flashcard[];
  onBack?: () => void;
  aiEnabled: boolean;
}
```

**Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "refactor: remove MatchMode types"
```

---

### Task 5: Delete MatchMode component

**Files:**
- Delete: `src/components/MatchMode.tsx`

**Step 1: Delete the file**

```bash
rm src/components/MatchMode.tsx
```

**Step 2: Commit**

```bash
git rm src/components/MatchMode.tsx
git commit -m "refactor: remove MatchMode component"
```

---

### Task 6: Update InputSection — restyle, remove CISSP references

**Files:**
- Modify: `src/components/InputSection.tsx`

**Step 1: Remove line numbers**

Remove `lineNumbersRef`, `handleScroll`, and the entire line-numbers `<div>` (the `ref={lineNumbersRef}` div with the `.map` that renders line numbers). Keep the textarea.

Simplify the editor container — remove the flex wrapper with the line numbers:

```tsx
<textarea
  ref={textareaRef}
  className="input-area"
  value={text}
  onChange={(e) => setText(e.target.value)}
  placeholder={useAI ? placeholderAI : placeholderCSV}
  disabled={isLoading}
  style={{
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '300px',
    lineHeight: '1.6',
    resize: 'vertical'
  }}
/>
```

**Step 2: Update placeholder text — remove CISSP references**

```tsx
const placeholderCSV = `光合作用,植物將光能轉化為化學能的過程
DNA,去氧核糖核酸，攜帶遺傳資訊的分子
有絲分裂,細胞核分裂為兩個相同的子核`;

const placeholderAI = `在這裡貼上您的學習筆記！例如：

文藝復興時期是歐洲的文化重生運動，起源於十四世紀的義大利。達文西和米開朗基羅是這個時期最著名的藝術家。`;
```

**Step 3: Update context placeholder**

Line 471, change `"選填情境（例如「CISSP 領域 1」、「生物學 101」）"` → `"選填情境（例如「生物學 101」、「日本歷史」）"`

**Step 4: Update CISSP reference in generateTermsOnly error**

Line 251, change the error message to remove "CISSP 領域 1":

```tsx
setError("請在選填情境欄位中輸入主題以產生詞彙（例如「生物學 101」）。");
```

**Step 5: Update help modal — remove CISSP mentions**

In the help modal, change the line mentioning CISSP:
- `"利用 AI 從原始文字自動產生學習材料。"` stays
- Change `"可選擇添加主題（例如「CISSP 領域 1」）來引導產生。"` → `"可選擇添加主題（例如「世界歷史」）來引導產生。"`

**Step 6: Update hardcoded color values**

- Settings panel `background: '#0f172a'` → `'var(--bg-primary)'`
- The AI-off warning `color: 'orange'` → `color: 'var(--text-secondary)'`
- Clear button `color: '#ef4444', borderColor: '#ef4444'` → `color: 'var(--error)', borderColor: 'var(--error)'`
- Error display `color: '#ef4444'` → `color: 'var(--error)'`

**Step 7: Remove help modal**

Delete the entire help modal block (the `{showHelp && (...)}` section) and the help button from the action bar. Remove `HelpCircle` from imports, remove `showHelp` state. Keep `setShowHelp` removal too.

**Step 8: Make settings collapsible inline (already is)**

The settings section is already a collapsible div. Keep this pattern.

**Step 9: Commit**

```bash
git add src/components/InputSection.tsx
git commit -m "refactor: simplify InputSection, remove line numbers and CISSP references"
```

---

### Task 7: Update QuizMode — restyle inline styles

**Files:**
- Modify: `src/components/QuizMode.tsx`

**Step 1: Update hardcoded color references**

- Replace all `'var(--accent-primary)'` → `'var(--accent)'`
- Replace all `'var(--bg-dark)'` → `'var(--bg-primary)'`
- Replace `rgba(0,0,0,0.2)` backgrounds → `'var(--bg-primary)'`
- Replace `rgba(0,0,0,0.8)` overlays → `'rgba(0,0,0,0.85)'`

**Step 2: Scenario settings placeholder**

Change `"例如：專注於雲端安全，或扮演面試官..."` → `"例如：專注於實際應用，或扮演面試官..."`

**Step 3: Simplify score display**

In the header area, remove the duplicate mobile/desktop score. Replace with a single compact counter:

```tsx
<span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
  <span style={{ color: 'var(--success)' }}>{correctCount}</span>
  {' / '}
  <span style={{ color: 'var(--error)' }}>{wrongCount}</span>
</span>
```

**Step 4: Commit**

```bash
git add src/components/QuizMode.tsx
git commit -m "refactor: update QuizMode colors and simplify score display"
```

---

### Task 8: Update RecallMode — restyle

**Files:**
- Modify: `src/components/RecallMode.tsx`

**Step 1: Update hardcoded colors**

- Replace `'var(--accent-primary)'` → `'var(--accent)'` (the question label color)
- Replace `rgba(34, 197, 94, 0.1)` → `'rgba(74, 222, 128, 0.05)'`
- Replace `rgba(239, 68, 68, 0.1)` → `'rgba(248, 113, 113, 0.05)'`
- Replace `rgba(255,255,255,0.1)` → `'var(--border)'`

**Step 2: Update feedback card border-radius to 0.75rem**

**Step 3: Commit**

```bash
git add src/components/RecallMode.tsx
git commit -m "refactor: update RecallMode colors to match new theme"
```

---

### Task 9: Update FlashcardMode — minor style fixes

**Files:**
- Modify: `src/components/FlashcardMode.tsx`

**Step 1: No functional changes needed** — CSS handles the restyle. Verify it looks correct.

**Step 2: Commit (if any changes)**

---

### Task 10: Update index.html and package.json — rebranding

**Files:**
- Modify: `index.html`
- Modify: `package.json`

**Step 1: Update index.html title**

Change `<title>cissp-quiz</title>` → `<title>FlashMaster</title>`

**Step 2: Update package.json name**

Change `"name": "cissp-quiz"` → `"name": "flashmaster"`

**Step 3: Commit**

```bash
git add index.html package.json
git commit -m "refactor: rename from cissp-quiz to FlashMaster"
```

---

### Task 11: Update CLAUDE.md and clean up

**Files:**
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md` (if CISSP references exist)

**Step 1: Remove MatchMode references from CLAUDE.md**

Remove the MatchMode bullet from Key Implementation Details. Update App Structure to remove MatchMode references.

**Step 2: Update AGENTS.md if needed**

Remove any CISSP-specific example text.

**Step 3: Commit**

```bash
git add CLAUDE.md AGENTS.md
git commit -m "docs: update documentation to reflect UI redesign"
```

---

### Task 12: Build verification

**Step 1: Run typecheck**

```bash
pnpm typecheck
```

Expected: no errors (MatchMode types and component fully removed, no dangling references)

**Step 2: Run lint**

```bash
pnpm lint
```

Expected: no errors

**Step 3: Run build**

```bash
pnpm build
```

Expected: successful production build

**Step 4: Visual verification**

```bash
pnpm dev
```

Open http://localhost:5173 and verify:
- Monochrome theme with teal accents
- No CISSP references visible
- Header shows "FlashMaster" with Create/Study nav
- Only 3 study tabs (Flashcard, Quiz, Recall)
- Quiz options are single-column
- Flashcard flip works with 0.4s animation
- Mobile bottom nav shows 3 tabs
- Settings collapse works in InputSection
