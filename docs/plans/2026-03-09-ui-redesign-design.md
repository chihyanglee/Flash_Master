# FlashMaster UI Redesign — Design Document

## Goal

Redesign FlashMaster from a CISSP-branded flashcard app to a general-purpose learning tool with a simplified, monochrome UI and better UX.

## Design Decisions

- **Color scheme:** Monochrome (near-black/gray/white) with muted teal (`#5eead4`) as the single accent color
- **Semantic colors:** Green/red retained only for correct/wrong answer feedback
- **Layout feel:** Spacious and minimal (Apple/Arc style), generous whitespace
- **Study modes:** Remove Match mode, keep Flashcard + Quiz + Recall
- **Name:** Keep "FlashMaster"

## Color System

```
--bg-primary:    #0a0a0a
--bg-card:       #141414
--bg-hover:      #1a1a1a
--text-primary:  #fafafa
--text-secondary:#737373
--text-muted:    #525252
--accent:        #5eead4
--accent-hover:  #2dd4bf
--accent-subtle: rgba(94, 234, 212, 0.1)
--success:       #4ade80
--error:         #f87171
--border:        #262626
```

## Typography

- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Base: 16px, line-height 1.6
- Headings: 600 weight, generous letter-spacing
- No gradient text effects

## Layout & Navigation

### Header
- Minimal top bar: "FlashMaster" wordmark left, settings icon right
- No subtitle, no gradient, no decorative elements
- Thin bottom border to separate from content

### Content Area
- Max-width 680px centered for study modes
- Max-width 800px for InputSection
- Padding: 24px desktop, 16px mobile
- Cards: `--bg-card` with 1px border, border-radius 12px, padding 24px

### Navigation
- Mode switch (Create/Study): two text buttons in header with teal underline for active
- Study tabs (desktop): horizontal text tabs with teal underline for active
- Study tabs (mobile): fixed bottom bar, 3 tabs (Flashcard/Quiz/Recall), 56px height

## Component Design

### InputSection
- Plain dark textarea, no line numbers, monospace font
- AI generation: teal outline button
- API settings: collapsible section at bottom, not a modal
- Context field: simple inline text input

### FlashcardMode
- 3D flip animation (0.4s duration)
- Full content width, centered typography
- Minimal prev/next arrows + counter ("3 / 24")
- Shuffle as small icon button

### QuizMode
- Question in card at top
- Options: full-width stacked vertical buttons
- Correct: green left-border + green text
- Wrong: red left-border + red text
- Score: small counter top-right ("12 / 20")
- Settings (question type, AI, scenario difficulty): collapsible row above question

### RecallMode
- Question card at top, large text input below
- Teal focus ring on input
- Hint: text button below input ("Show hint")
- Grade feedback inline below input
- Small progress counter

### Removed
- MatchMode component
- Help modal
- All gradient effects and violet colors

## Mobile (640px breakpoint)
- Bottom nav: 3 tabs, 56px, `--bg-card` with top border
- Tab labels: 0.75rem, icons 20px
- Content padding: 16px
- Cards: border-radius 8px, padding 16px

## Rebranding
- Replace all CISSP references with generic examples
- Update package name from `cissp-quiz`
- Update HTML title
- Update/remove GitHub links to CISSP-Quiz repo
