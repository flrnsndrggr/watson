# games.watson.ch — Dev Brief

**Date:** April 2026
**For:** Frontend & backend development team
**Context:** You will NOT have access to watson.ch source code. This brief provides everything needed to build games that feel native to watson.ch, based on design tokens extracted from the live site.

---

## 1. Architecture Overview

### Stack Recommendation

```
Frontend:  React 18+ / TypeScript / Vite
Styling:   CSS Modules or Tailwind (configured to watson tokens)
State:     Zustand or React Context (lightweight, no Redux overkill)
Backend:   Node.js / Express or Supabase Edge Functions
Database:  PostgreSQL (Supabase) — puzzles, user accounts, stats, leaderboards
Auth:      Email magic link → OneID integration (Phase 2)
Hosting:   Vercel or Netlify (SSR for SEO, edge for speed)
Analytics: Plausible or Matomo (privacy-first, Swiss hosting preferred)
```

### Why NOT iframe embeds

watson.ch currently embeds the Kreuzworträtsel via iframe. **Do not repeat this pattern.** Iframes:
- Break on mobile (viewport issues, scroll traps, keyboard overlap)
- Cannot share state with watson.ch (auth, analytics, theme)
- Are invisible to SEO crawlers
- Cannot integrate with watson's ad stack
- Cannot access device APIs (haptics, share sheet)

Build natively. Serve from watson.ch's domain (path-based: `watson.ch/spiele/*`). If separate deployment is needed, use reverse proxy to keep under watson.ch domain.

---

## 2. Watson.ch Design System (Extracted from Live Site)

### Typography

```css
/* Primary body font */
font-family: "Nunito Sans", "Adjusted Verdana Fallback", sans-serif;

/* Headings (article titles, h2+) */
font-family: "Onest", "Adjusted Verdana Fallback", sans-serif;

/* Font loading: Google Fonts or self-hosted */
/* Nunito Sans: https://fonts.google.com/specimen/Nunito+Sans */
/* Onest: https://fonts.google.com/specimen/Onest */
```

**Font sizes observed on watson.ch:**

| Element | Size | Weight | Usage |
|---|---|---|---|
| Category label (e.g., "Quiz") | 13px | 600 | Section headers, breadcrumbs |
| Article headline (large) | 60px | — | Hero/feature article title (Onest) |
| Body text | 16px | 400 | Standard paragraph text |
| Nav items | 14–16px | 400/600 | Navigation links |
| Small/meta text | 11–12px | 400 | Timestamps, bylines |

### Color Palette

```css
:root {
  /* watson brand colors (extracted from live site) */
  --watson-cyan:     rgb(0, 198, 255);    /* #00C6FF — primary accent, links */
  --watson-pink:     rgb(244, 15, 151);   /* #F40F97 — secondary accent, highlights, DE toggle */
  --watson-green:    rgb(123, 212, 0);    /* #7BD400 — category labels (Schweiz, International, Wirtschaft) */
  --watson-blue:     rgb(15, 108, 245);   /* #0F6CF5 — tertiary accent */

  /* Neutrals */
  --watson-nav-bg:   rgb(26, 26, 26);     /* #1A1A1A — header/nav background */
  --watson-white:    rgb(255, 255, 255);   /* #FFFFFF — content background, nav text */
  --watson-gray-bg:  rgb(236, 236, 236);   /* #ECECEC — subtle background sections */
  --watson-black:    rgb(0, 0, 0);         /* #000000 — body text */
  --watson-gray:     rgb(119, 119, 119);   /* #777777 — secondary text, category headers */
  --watson-overlay:  rgba(0, 0, 0, 0.45);  /* overlay/modal backdrop */
}
```

**Color usage rules for games:**
- **Cyan (#00C6FF)** → primary interactive elements, selected states, links, CTAs
- **Pink (#F40F97)** → success states, streak highlights, celebration moments
- **Green (#7BD400)** → correct answers, positive feedback
- **Nav dark (#1A1A1A)** → do NOT override watson's nav; games sit below it
- **White (#FFF)** → game board background, cards
- **Black (#000)** → text on white backgrounds

### Layout

```css
/* watson.ch content area */
max-width: 1026px;        /* article content */
/* full-width sections: 1326px observed */
/* nav height: 85px */

/* Games should use: */
.game-container {
  max-width: 600px;        /* games are focused, not full-width */
  margin: 0 auto;
  padding: 16px;
}

/* On mobile (watson is mobile-first): */
@media (max-width: 768px) {
  .game-container {
    max-width: 100%;
    padding: 12px;
  }
}
```

### Component Patterns

**Buttons (watson style):**
```css
.watson-btn-primary {
  background-color: var(--watson-cyan);
  color: var(--watson-white);
  border: none;
  border-radius: 4px;          /* watson uses minimal rounding */
  padding: 10px 20px;
  font-family: "Nunito Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.watson-btn-primary:hover {
  opacity: 0.85;
}
```

**Cards/tiles (for game grids):**
```css
.game-tile {
  background: var(--watson-white);
  border: 2px solid var(--watson-gray-bg);
  border-radius: 6px;          /* slightly more rounded than watson's 0px cards */
  padding: 12px;
  font-family: "Nunito Sans", sans-serif;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.game-tile.selected {
  background: var(--watson-cyan);
  color: var(--watson-white);
  border-color: var(--watson-cyan);
}
.game-tile.correct {
  background: var(--watson-green);
  color: var(--watson-white);
  border-color: var(--watson-green);
}
.game-tile.wrong {
  background: var(--watson-pink);
  color: var(--watson-white);
  border-color: var(--watson-pink);
  animation: shake 0.4s ease;
}
```

---

## 3. Game-by-Game Technical Specs

### 3.1 Verbindige (Swiss Connections)

**Data model:**
```typescript
interface VerbindigePuzzle {
  id: string;
  date: string;                    // YYYY-MM-DD, one per day
  groups: VerbindigeGroup[];       // exactly 4
  created_by: string;              // puzzle editor
}

interface VerbindigeGroup {
  category: string;                // e.g., "Kantone am Bodensee"
  difficulty: 1 | 2 | 3 | 4;      // 1=yellow, 2=green, 3=blue, 4=purple
  items: VerbindigeItem[];         // exactly 4
}

interface VerbindigeItem {
  text: string;                    // display text
  image_url?: string;              // optional image (for image-based items)
  emoji?: string;                  // optional emoji variant
}
```

**UI layout:**
```
┌─────────────────────────────────────┐
│         VERBINDIGE  #042            │
│       Finde 4 Gruppen à 4           │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │Züri│ │Bern│ │Tofu│ │Jazz│      │
│  └────┘ └────┘ └────┘ └────┘      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │Wein│ │Olma│ │Rock│ │Genf│      │
│  └────┘ └────┘ └────┘ └────┘      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │Soul│ │Reis│ │Biel│ │Funk│      │
│  └────┘ └────┘ └────┘ └────┘      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│  │Käse│ │Luzn│ │Brot│ │Oper│      │
│  └────┘ └────┘ └────┘ └────┘      │
│                                     │
│  Fehler: ●●●○  (1 of 4 used)       │
│                                     │
│  [Auswahl löschen]  [Prüfen]       │
│                                     │
└─────────────────────────────────────┘
```

**Key interactions:**
- Tap tile → toggles selection (max 4 selected)
- "Prüfen" button → validates group
  - Correct: tiles animate up into solved group row (colored by difficulty), group label revealed
  - Wrong: tiles shake, error dot fills in
  - "One away": toast notification "Fast! Nur 1 falsch." (important UX cue, NYT does this)
- After solve or 4 errors: results screen with share button
- Share format:
  ```
  Verbindige #042 🇨🇭
  🟨🟨🟨🟨
  🟩🟩🟩🟩
  🟦🟦🟦🟦
  🟪🟪🟪🟪
  watson.ch/spiele/verbindige
  ```

**Animations:**
- Tile selection: scale(1.03) + cyan border, 150ms ease
- Correct group: tiles slide up into row, 400ms ease-out
- Wrong guess: translateX shake keyframe, 400ms
- Game complete: confetti burst (use canvas-confetti library, ~3KB)

---

### 3.2 Buchstäbli (Swiss Word Hex)

**Data model:**
```typescript
interface BuchstaebliPuzzle {
  id: string;
  date: string;
  center_letter: string;           // must be in every word
  outer_letters: string[];         // exactly 6
  pangram: string;                 // word using all 7 letters
  valid_words: ValidWord[];        // all accepted words
  max_score: number;               // sum of all word scores
  rank_thresholds: {               // % of max_score
    stift: 0;                      // 0%
    lehrling: number;              // ~20%
    geselle: number;               // ~40%
    meister: number;               // ~70%
    bundesrat: number;             // ~90%
  };
}

interface ValidWord {
  word: string;
  is_pangram: boolean;
  is_mundart: boolean;             // Swiss German → 2× points
  points: number;                  // 4-letter = 1pt, 5+ = length, pangram = +7, mundart = 2×
}
```

**UI layout:**
```
┌─────────────────────────────────────┐
│       BUCHSTÄBLI  #042              │
│     Rang: Geselle (45/112 Pkt)      │
│     ████████░░░░░░░░                │
│                                     │
│           ┌───┐                     │
│          /  R  \                    │
│     ┌───┐       ┌───┐              │
│    /  E  \ ┌───┐/  T  \            │
│    └───┘ / *A* \ └───┘             │  ← center letter highlighted
│     ┌───┐ └───┘ ┌───┐              │
│    /  N  \      /  S  \             │
│     └───┘ ┌───┐ └───┘              │
│          /  L  \                    │
│           └───┘                     │
│                                     │
│  ┌─────────────────────────┐        │
│  │ R A T E N              │← input  │
│  └─────────────────────────┘        │
│                                     │
│  [Mischen]  [Löschen]  [Enter ↵]   │
│                                     │
│  Gefundene Wörter (12):             │
│  RATEN · STERN · TRANS · ...        │
│                                     │
└─────────────────────────────────────┘
```

**Key interactions:**
- Tap hex letter → appends to input field
- Tap center letter → always available (highlighted in pink/cyan)
- "Enter" or submit → validates word
  - Accepted: word appears in found list, score updates, rank bar progresses
  - Already found: toast "Schon gefunden!"
  - Too short: toast "Mindestens 4 Buchstaben"
  - Not in dictionary: toast "Nicht im Wörterbuch"
  - Missing center letter: toast "Der Buchstabe [X] muss dabei sein"
  - Pangram found: celebration animation + "+7 Bonus!" toast
  - Mundart word: toast "Mundart-Bonus! 2× Punkte 🇨🇭"
- "Mischen" (shuffle): rotates outer letters randomly (visual refresh, no gameplay effect)
- Physical keyboard supported on desktop

**Dictionary architecture:**
```
/api/buchstaebli/validate
POST { word: string, puzzle_id: string }
→ { valid: boolean, is_pangram: boolean, is_mundart: boolean, points: number }

Dictionary stored server-side (NEVER send full word list to client — cheating prevention).
Client sends word → server validates → returns result.

Word lists:
- Primary: Duden German dictionary (~150K words, 4+ letters)
- Mundart: Curated Swiss German list (~2,000 words at launch)
  - Sources: Schweizerisches Idiotikon, Swiss German Wiktionary, editorial curation
  - Community submission pipeline: /api/mundart/submit { word, definition, region }
```

---

### 3.3 Schlagziil (The Headline Game)

**Data model:**
```typescript
interface SchlagziilPuzzle {
  id: string;
  date: string;
  headlines: SchlagziilHeadline[];  // exactly 5
}

interface SchlagziilHeadline {
  original: string;                 // full headline text
  blanked_word: string;             // the removed word (answer)
  display: string;                  // headline with _____ replacing the word
  article_url: string;              // link to watson.ch article
  article_date: string;             // when article was published
  category: string;                 // watson category (Schweiz, Sport, etc.)
  accepted_answers: string[];       // variations (e.g., ["Solarenergie", "Solar-Energie"])
}
```

**UI layout:**
```
┌─────────────────────────────────────┐
│        SCHLAGZIIL  #042             │
│   Errate das fehlende Wort          │
│                                     │
│  ┌─ Schweiz ──────────────────────┐ │
│  │                                 │ │
│  │  "Der Bundesrat will die _____ │ │
│  │   bis 2030 verdoppeln"         │ │
│  │                                 │ │
│  │  ┌───────────────────┐  [→]   │ │
│  │  │ Solarenergie      │         │ │
│  │  └───────────────────┘         │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ● ● ● ○ ○   Headline 3/5          │
│  ✓ ✓         Fehler: ●○○ (1/3)     │
│                                     │
│  [watson-Artikel lesen →]           │
│                                     │
└─────────────────────────────────────┘
```

**Key interactions:**
- One headline shown at a time
- Text input → submit (Enter or tap arrow)
- Correct: green flash, "watson-Artikel lesen →" link appears, auto-advance to next after 2s
- Wrong: red flash, error counter increments, can retry same headline
- After 3 total errors OR 5 headlines completed: results screen
- Results screen shows all 5 headlines with correct answers + article links
- Share format:
  ```
  Schlagziil #042 📰 4/5
  🟩🟩🟥🟩🟩
  Ich lese watson, und du?
  watson.ch/spiele/schlagziil
  ```

**Answer validation:**
```typescript
function validateAnswer(guess: string, headline: SchlagziilHeadline): boolean {
  const normalized = guess.trim().toLowerCase()
    .replace(/[äàâ]/g, 'a').replace(/[öô]/g, 'o').replace(/[üû]/g, 'u')
    // Keep umlauts but also accept non-umlaut versions
  return headline.accepted_answers.some(answer =>
    normalize(answer) === normalized ||
    levenshtein(normalize(answer), normalized) <= 1  // allow 1 typo
  );
}
```

**Editorial workflow:**
- Daily: watson editors select 5 headlines from past 7 days via simple CMS tool
- CMS tool: list of recent headlines → editor clicks → selects word to blank → saves
- Fallback: if no editor input by 22:00, auto-select from top-5 most-read articles, blank the longest noun

---

## 4. Shared Infrastructure

### User Accounts & Streaks

```typescript
interface UserProfile {
  id: string;
  email: string;
  username: string;                // displayed on leaderboard
  created_at: string;
  oneid_linked: boolean;           // Phase 2
  streaks: {
    verbindige: StreakData;
    buchstaebli: StreakData;
    schlagziil: StreakData;
  };
}

interface StreakData {
  current: number;                 // consecutive days played
  longest: number;                 // all-time best
  last_played: string;             // YYYY-MM-DD
}

// Streak logic:
// - Streak increments if user completes puzzle on consecutive calendar days (Swiss timezone, UTC+1/+2)
// - Missing a day resets streak to 0
// - Playing a past puzzle from archive does NOT count for streak
// - Streak is per-game, not global
```

### Daily Puzzle Delivery

```
Puzzle lifecycle:
1. Puzzle editor creates puzzle in CMS (target: 1 week ahead buffer)
2. Puzzle stored in DB with publish_date
3. At 00:00 CET, /api/[game]/today returns new puzzle
4. Client caches puzzle in memory (NOT localStorage — avoid stale state)
5. User progress stored server-side (resume across devices)
6. At 00:00 CET next day, puzzle locks → only available in archive
```

### API Structure

```
Base: watson.ch/api/spiele/

GET  /verbindige/today          → today's puzzle (no answers)
POST /verbindige/guess          → { puzzle_id, selected_items[] } → { correct, group?, game_over? }
GET  /verbindige/archive/:date  → past puzzle

GET  /buchstaebli/today         → today's puzzle (letters + thresholds, no word list)
POST /buchstaebli/validate      → { puzzle_id, word } → { valid, points, is_pangram, is_mundart }
GET  /buchstaebli/archive/:date

GET  /schlagziil/today          → today's puzzle (headlines with blanks, no answers)
POST /schlagziil/guess          → { puzzle_id, headline_index, guess } → { correct, accepted_answer? }
GET  /schlagziil/archive/:date

POST /auth/register             → { email } → sends magic link
POST /auth/verify               → { token } → { session_token, user }
GET  /user/profile              → streaks, stats, leaderboard position
GET  /leaderboard/:game/:period → { users[], user_rank }
```

### Share Card Generation

Each game produces a shareable text + optional image card.

**Text share (WhatsApp, copy-paste):**
```typescript
function generateShareText(game: string, number: number, result: string): string {
  const headers = {
    verbindige: `Verbindige #${number} 🇨🇭`,
    buchstaebli: `Buchstäbli #${number} 🔤`,
    schlagziil: `Schlagziil #${number} 📰`,
  };
  return `${headers[game]}\n${result}\nwatson.ch/spiele/${game}`;
}
```

**Image share (Instagram Stories):**
Generate a 1080×1920 canvas with watson branding (dark bg, cyan/pink accents, result grid, watson logo). Use html2canvas or server-side Sharp/Canvas rendering.

---

## 5. Performance Requirements

| Metric | Target | Why |
|---|---|---|
| First Contentful Paint | < 1.2s | Mobile users on Swiss 4G |
| Time to Interactive | < 2.0s | Game must be playable fast |
| Bundle size (per game) | < 80KB gzipped | watson.ch already heavy with ads |
| API response time | < 100ms (p95) | Guess validation must feel instant |
| Offline resilience | Puzzle cached after first load | Swiss train tunnels |

### Optimization notes:
- Code-split per game (don't load Buchstäbli JS when playing Verbindige)
- Preload today's puzzle data in HTML (inline JSON, no waterfall)
- Use CSS animations over JS animations (GPU-accelerated)
- No heavy libraries — canvas-confetti (~3KB) is the only allowed "fun" dependency
- Images (for Verbindige image items): WebP, max 200KB, lazy-loaded

---

## 6. Ad Integration Points

Games must integrate with watson.ch's existing ad stack (likely Google Ad Manager / Goldbach).

```
┌─────────────────────────────────────┐
│ [watson nav bar]                    │
├─────────────────────────────────────┤
│ [SPONSOR BAR: "Presented by X"]     │ ← 728×90 leaderboard or sponsor logo
├─────────────────────────────────────┤
│                                     │
│        [GAME AREA]                  │ ← NO ads inside game board
│                                     │
├─────────────────────────────────────┤
│ [RESULTS / POST-GAME]              │
│ [MREC 300×250 ad unit]             │ ← high-attention post-game placement
├─────────────────────────────────────┤
│ [Related watson articles]           │
│ [MREC 300×250 ad unit]             │
└─────────────────────────────────────┘

Pre-game interstitial (mobile only):
- 5-second non-skippable or 3-second skippable
- Shown once per session, not per game
- Uses watson.ch's existing interstitial ad slot format
```

**Rules:**
- NEVER interrupt gameplay with ads (no mid-game popups)
- Sponsor bar is persistent but unobtrusive (text + logo, not animated)
- Post-game is the highest-value placement (user just completed something, high attention)

---

## 7. Accessibility

- Full keyboard navigation for all games
- ARIA labels on all interactive elements
- Color-blind safe: don't rely solely on color for game state — use icons/patterns alongside color (✓ on correct tiles, ✗ on wrong)
- Min touch target: 44×44px (WCAG AA)
- Screen reader: announce game state changes ("Gruppe gefunden: Kantone am Bodensee")
- Reduced motion: respect `prefers-reduced-motion` — disable confetti, use opacity transitions instead of transforms

---

## 8. Testing Strategy

| Layer | Tool | What |
|---|---|---|
| Unit | Vitest | Game logic (validation, scoring, streak calculation) |
| Component | React Testing Library | UI state transitions, tile selection, input handling |
| E2E | Playwright | Full game flows on mobile + desktop viewports |
| Visual regression | Chromatic or Percy | Catch unintended layout changes |
| Load | k6 | API endpoints under 10K concurrent players |
| Cross-browser | BrowserStack | Safari iOS, Chrome Android, Firefox, Edge |

**Critical test scenarios:**
- Midnight rollover: verify new puzzle loads at 00:00 CET, old puzzle locks
- Streak edge cases: timezone handling, missed day, playing at 23:59
- Buchstäbli dictionary: validate no profanity in accepted words
- Schlagziil: verify answer normalization handles umlauts, typos, hyphenation
- Offline: verify puzzle remains playable after network drop (after initial load)
- Ad integration: verify game functions correctly when ad blocker is active (watson.ch already has ad blocker detection — games should work regardless)

---

## 9. Development Timeline

```
Week 1–2:   Project setup, design system tokens, shared components
            (game shell, nav integration, auth flow, API scaffolding)

Week 3–4:   Verbindige MVP (grid, selection, validation, animations, share)

Week 5–6:   Buchstäbli MVP (hex grid, input, dictionary API, scoring, ranks)

Week 7–8:   Schlagziil MVP (headline display, input, validation, article links)

Week 9:     Streaks, user accounts, leaderboard

Week 10:    Ad integration, sponsor bar, analytics events

Week 11:    QA, accessibility audit, performance optimization, cross-browser

Week 12:    Soft launch (internal), bug fixes, difficulty calibration

Week 13:    Public launch
```

**Total: ~13 weeks / 3 months to public launch.**

---

## 10. Analytics Events to Track

```typescript
// Core events (every game)
track('game_started', { game, puzzle_id, date, is_authenticated })
track('game_completed', { game, puzzle_id, result, time_seconds, mistakes })
track('game_shared', { game, puzzle_id, share_method }) // whatsapp, copy, instagram
track('streak_milestone', { game, streak_length }) // at 7, 30, 100, 365

// Verbindige-specific
track('verbindige_guess', { puzzle_id, guess_number, correct, one_away })

// Buchstäbli-specific
track('buchstaebli_word_found', { puzzle_id, word, is_pangram, is_mundart, points })
track('buchstaebli_rank_reached', { puzzle_id, rank })

// Schlagziil-specific
track('schlagziil_headline_solved', { puzzle_id, headline_index, attempts })
track('schlagziil_article_clicked', { puzzle_id, headline_index, article_url })

// Engagement
track('account_created', { referral_source }) // game_prompt, organic, share_link
track('push_notification_opted_in', { game })
track('archive_puzzle_played', { game, puzzle_date })
```

---

## Appendix: CSS Quick Reference

For devs who need to match watson.ch's look without source access — copy these tokens:

```css
/* ===== WATSON GAMES DESIGN TOKENS ===== */

:root {
  /* Typography */
  --font-body: "Nunito Sans", "Adjusted Verdana Fallback", sans-serif;
  --font-heading: "Onest", "Adjusted Verdana Fallback", sans-serif;

  /* Watson brand colors */
  --color-cyan: #00C6FF;
  --color-pink: #F40F97;
  --color-green: #7BD400;
  --color-blue: #0F6CF5;

  /* Neutrals */
  --color-nav-bg: #1A1A1A;
  --color-white: #FFFFFF;
  --color-gray-bg: #ECECEC;
  --color-black: #000000;
  --color-gray-text: #777777;

  /* Game-specific (Verbindige difficulty colors) */
  --color-difficulty-1: #FFD700;  /* yellow — easy */
  --color-difficulty-2: #7BD400;  /* green — medium (watson green) */
  --color-difficulty-3: #0F6CF5;  /* blue — hard (watson blue) */
  --color-difficulty-4: #9B59B6;  /* purple — tricky */

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Game layout */
  --game-max-width: 600px;
  --game-tile-gap: 8px;
  --game-tile-radius: 6px;

  /* Animation */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease-out;
}

/* ===== ANIMATIONS ===== */

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

@keyframes slideUp {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(-20px); opacity: 0; }
}

@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes progressFill {
  from { width: 0%; }
  to { width: var(--progress); }
}

/* ===== TOAST NOTIFICATIONS ===== */

.toast {
  position: fixed;
  top: 100px;           /* below watson nav (85px) + spacing */
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-nav-bg);
  color: var(--color-white);
  padding: 8px 16px;
  border-radius: 4px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  z-index: 1000;
  animation: popIn var(--transition-normal);
}
```

---

*Build it native. Build it fast. Build it Swiss.*
