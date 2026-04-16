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

### 3.1 Verbindige (Mundart Connections)

**Core mechanic:** 16 arcane Swiss German dialect words in a 4×4 grid. Players must decode the Mundart meaning AND find the grouping logic. Double cognitive layer.

**Data model:**
```typescript
interface VerbindigePuzzle {
  id: string;
  date: string;                    // YYYY-MM-DD, one per day
  groups: VerbindigeGroup[];       // exactly 4
  created_by: string;              // puzzle editor (must be native Mundart speaker)
}

interface VerbindigeGroup {
  category_label: string;          // Hochdeutsch reveal, e.g., "Wörter für Kopf"
  difficulty: 1 | 2 | 3 | 4;      // 1=yellow, 2=green, 3=blue, 4=purple
  items: VerbindigeItem[];         // exactly 4
}

interface VerbindigeItem {
  mundart_word: string;            // the displayed dialect word, e.g., "Gring"
  hochdeutsch: string;             // standard German translation (shown post-solve)
  region?: string;                 // optional: canton/region of origin, e.g., "Bern"
}
```

**UI layout:**
```
┌─────────────────────────────────────┐
│       VERBINDIGE  #042 🇨🇭          │
│     Finde 4 Gruppen à 4 Mundart    │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  │Gring │ │Rüebli│ │Töffli│ │Kabis │
│  └──────┘ └──────┘ └──────┘ └──────┘
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  │Grind │ │Güxi  │ │Bire  │ │Velo  │
│  └──────┘ └──────┘ └──────┘ └──────┘
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  │Härdöp│ │Tschol│ │Trottl│ │Nüssli│
│  └──────┘ └──────┘ └──────┘ └──────┘
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  │Chrüsi│ │Puff  │ │Sürmel│ │Tohu  │
│  └──────┘ └──────┘ └──────┘ └──────┘
│                                     │
│  Fehler: ●●●○  (1 of 4 used)       │
│                                     │
│  [Auswahl löschen]  [Prüfen]       │
│                                     │
└─────────────────────────────────────┘

SOLVED GROUP REVEAL:
┌─────────────────────────────────────┐
│  🟨 Wörter für Kopf                │
│  Gring (ZH) · Grind (BE) ·         │
│  Bire (AG) · Tscholi (SG)          │
└─────────────────────────────────────┘
```

**Key UX detail — the post-solve reveal:**
When a group is solved, the category label appears in Hochdeutsch AND each word shows its region of origin in parentheses. This is the "aha!" and educational moment. Players learn: "I didn't know Tscholi means Kopf in St. Gallen dialect." This drives sharing and conversation.

**Key interactions:**
- Tap tile → toggles selection (max 4 selected). Tiles truncate long words with ellipsis; full word shown on long-press/hover.
- "Prüfen" → validates group
  - Correct: tiles animate up into solved group row (colored by difficulty), Hochdeutsch category + regional origins revealed
  - Wrong: tiles shake, error dot fills
  - "One away": toast "Fast! Nur 1 Wort falsch."
- After solve or 4 errors: results screen with all group reveals + share button
- Share format:
  ```
  Verbindige #042 🇨🇭
  🟨🟨🟨🟨
  🟩🟩🟩🟩
  🟦🟦🟦🟦
  🟪🟪🟪🟪
  Hesch gwüsst dass Tscholi Chopf heisst?
  watson.ch/spiele/verbindige
  ```
  Note: share text includes a highlight from the purple (hardest) group to spark conversation.

**Animations:**
- Tile selection: scale(1.03) + cyan border, 150ms ease
- Correct group: tiles slide up into reveal row, 400ms ease-out. Region tags fade in 200ms after.
- Wrong guess: translateX shake keyframe, 400ms
- Game complete: confetti burst (canvas-confetti, ~3KB)

**Content sourcing:**
- Primary: Schweizerisches Idiotikon (historical dictionary of Swiss German)
- Secondary: Mundart-Lexikon, cantonal dialect guides
- Puzzle editor curates daily: selects 16 words, assigns to 4 groups, calibrates difficulty
- Word bank: target 1,000+ validated Mundart words at launch, categorized by region + meaning
- Difficulty scaling: yellow group uses common Mundart (Rüebli, Velo); purple uses deep-cut regional words

---

### 3.2 Zämesetzli (Compound Word Builder)

**Core mechanic:** 10 emojis displayed as a pool. Players combine any 2 (or 3) to form valid German compound words. Open-ended discovery — find as many as possible.

**Data model:**
```typescript
interface ZaemesetzliPuzzle {
  id: string;
  date: string;
  emojis: EmojiItem[];             // exactly 10
  valid_compounds: CompoundWord[]; // 12–20 pre-validated combinations
  max_score: number;
  rank_thresholds: {
    stift: 0;
    lehrling: number;              // ~20% of max
    geselle: number;               // ~40%
    meister: number;               // ~70%
    bundesrat: number;             // ~90%
  };
}

interface EmojiItem {
  emoji: string;                   // e.g., "🏠"
  canonical_noun: string;          // e.g., "Haus" — shown on hover/long-press
  alt_nouns: string[];             // e.g., ["Gebäude", "Heim"] — accepted alternatives
}

interface CompoundWord {
  word: string;                    // e.g., "Hausschlüssel"
  components: string[];            // e.g., ["🏠", "🔑"] — which emojis form it
  difficulty: 1 | 2 | 3;          // 1=obvious, 2=medium, 3=creative
  points: number;                  // 1pt common, 2pt uncommon, 3pt rare/Mundart
  is_mundart: boolean;             // Swiss German compound → bonus celebration
  hint?: string;                   // optional hint shown after X minutes
}
```

**UI layout:**
```
┌─────────────────────────────────────┐
│       ZÄMESETZLI  #042 🧩           │
│   Rang: Lehrling (12/48 Pkt)       │
│   ████████░░░░░░░░░░░░             │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  🏠  🔑  🌳  🍎  ⛰️        │   │
│   │  🧀  🔔  🐄  ☀️  🚪        │   │
│   └─────────────────────────────┘   │
│                                     │
│   Kombiniere:                       │
│   ┌────┐  +  ┌────┐  =  ?         │
│   │ 🏠 │     │ 🔑 │               │
│   └────┘     └────┘               │
│                                     │
│   ┌─────────────────────────┐       │
│   │ Hausschlüssel           │  [→]  │
│   └─────────────────────────┘       │
│                                     │
│   Gefunden (4/16):                  │
│   🏠🔑 Hausschlüssel (1pt)         │
│   🐄🔔 Kuhglocke (1pt)            │
│   🏠🚪 Haustür (1pt)              │
│   🧀⛰️ Alpkäse (3pt 🇨🇭)          │
│                                     │
│   [Aufgeben & Lösung zeigen]        │
│                                     │
└─────────────────────────────────────┘
```

**Key interactions:**
- **Emoji selection:** Tap first emoji → it highlights in slot 1. Tap second emoji → slot 2. Optionally tap third → slot 3 (for 3-part compounds like Sonnen+blumen+öl).
- **Word input:** After selecting emojis, type the compound word. Submit with Enter or tap arrow.
- **Validation flow:**
  - Valid compound using selected emojis: word appears in "Gefunden" list, score updates, rank bar progresses. Celebration animation scaled to difficulty (subtle for 1pt, bigger for 3pt).
  - Valid German word but NOT in puzzle's valid list: toast "Gutes Wort, aber nicht in der heutigen Lösung!"
  - Invalid word: toast "Kein gültiges Wort"
  - Wrong emoji combination for that word: toast "Stimmt, aber andere Emojis!" (word exists but player used wrong emoji pair)
  - Already found: toast "Schon gefunden!"
  - Mundart compound found: toast "Mundart-Bonus! 🇨🇭" + extra celebration
- **Emoji noun reveal:** Long-press/hover on any emoji shows its canonical noun (e.g., long-press 🏠 → "Haus"). This reduces ambiguity without giving away answers.
- **Hint system:** After 10 minutes of play, a "Tipp" button appears. Tapping reveals one undiscovered emoji pair (but not the word). Costs -1pt from final score.
- **End state:** No hard end — player can keep searching or tap "Aufgeben" to see all undiscovered combinations. Game locks at midnight.
- **Share format:**
  ```
  Zämesetzli #042 🧩
  14/16 gefunden · 38 Pkt · Meister
  Bestes Wort: 🧀⛰️ Alpkäse 🇨🇭
  watson.ch/spiele/zaemesetzli
  ```

**Compound word validation architecture:**
```
POST /api/zaemesetzli/validate
{
  puzzle_id: string,
  emoji_ids: string[],        // which emojis were selected (by index or emoji char)
  word: string                // the compound word guess
}
→ {
  valid: boolean,
  in_puzzle: boolean,         // valid word but is it in today's solution set?
  points: number,
  is_mundart: boolean,
  difficulty: 1 | 2 | 3,
  already_found: boolean
}

// CRITICAL: Valid compound list stored server-side only.
// Client never receives the full solution set.
// Each emoji's canonical noun is sent to client (for hover/long-press),
// but the valid combinations are NOT derivable from this alone.
```

**Emoji curation:**
- ~100 emojis curated at launch, each with canonical German noun + alt nouns
- Puzzle editor selects 10 per day, pre-validates all valid compound combinations
- Emoji rendering: use platform-native emoji (accept cross-platform variation). Add `aria-label` with canonical noun for accessibility. Consider Twemoji fallback if rendering consistency is critical.
- Compound dictionary: Duden compounds (~50K) + curated Swiss German compounds (~500 at launch)
- Community submission: /api/zaemesetzli/suggest { emoji_pair, word } — reviewed by puzzle editor weekly

---

### 3.3 Schlagziil (The watson Archive Headline Game)

**Core mechanic:** 5 headlines from watson.ch's full archive (2014–today). Each has a key word blanked out. Year shown as context clue. Guess the missing word. 3 wrong guesses total.

**Data model:**
```typescript
interface SchlagziilPuzzle {
  id: string;
  date: string;
  headlines: SchlagziilHeadline[];  // exactly 5
}

interface SchlagziilHeadline {
  original: string;                 // full headline text
  blanked_word: string;             // the removed word (primary answer)
  display: string;                  // headline with _____ replacing the word
  article_url: string;              // link to watson.ch article (verified non-broken)
  article_year: number;             // year of publication (shown as context clue)
  article_date: string;             // full date (shown post-solve)
  category: string;                 // watson category (Schweiz, Sport, etc.)
  accepted_answers: string[];       // variations (spelling, abbreviation, synonym)
  difficulty: 1 | 2 | 3;           // 1=easy (recent, major), 2=medium, 3=hard (old, niche)
  context_hint?: string;            // optional 1-sentence context (shown on "Tipp" tap)
}
```

**Difficulty mixing per puzzle:**
Each daily puzzle has a fixed difficulty spread:
- 2× easy (recent major events, within last 12 months)
- 2× medium (older or more niche, 1–5 years ago)
- 1× hard (deep cut, 5+ years old or very specific)

Headlines are ordered easy → hard within a puzzle.

**UI layout:**
```
┌─────────────────────────────────────┐
│       SCHLAGZIIL  #042 📰           │
│    Errate das fehlende Wort         │
│                                     │
│  ┌─ 🕐 2023 · Wirtschaft ────────┐ │
│  │                                 │ │
│  │  "Credit Suisse wird von       │ │
│  │   _____ übernommen"            │ │
│  │                                 │ │
│  │  ┌───────────────────┐  [→]   │ │
│  │  │ UBS               │         │ │
│  │  └───────────────────┘         │ │
│  │                                 │ │
│  │  [💡 Tipp]                     │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Headline 3/5                       │
│  ✓ ✓ _  _ _    Fehler: ●○○ (1/3)  │
│                                     │
│  [watson-Artikel lesen →]           │
│                                     │
└─────────────────────────────────────┘
```

**Key interactions:**
- One headline at a time, year + category shown as context clues
- Text input → submit (Enter or tap arrow)
- "Tipp" button: reveals the 1-sentence context hint (e.g., "Die grösste Bankenübernahme in der Schweizer Geschichte"). Available from the start, but using it marks the headline as "assisted" in share results.
- Correct: green flash, full headline + article date revealed, "watson-Artikel lesen →" link appears, auto-advance after 2.5s
- Wrong: red flash, error counter increments, can retry same headline
- After 3 total errors OR 5 headlines completed: results screen
- Results screen: all 5 headlines with correct answers, article dates, article links. "Kennst du watson?" CTA.
- Share format:
  ```
  Schlagziil #042 📰 4/5
  2023 ✓ | 2019 ✓ | 2026 ✗ | 2017 ✓ | 2024 ✓💡
  Kennst du watson? watson.ch/spiele/schlagziil
  ```
  (💡 = hint was used on that headline)

**Answer validation:**
```typescript
function validateAnswer(guess: string, headline: SchlagziilHeadline): boolean {
  const normalize = (s: string) => s.trim().toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss').replace(/-/g, '');

  const normalizedGuess = normalize(guess);

  return headline.accepted_answers.some(answer => {
    const normalizedAnswer = normalize(answer);
    // Exact match (after normalization)
    if (normalizedAnswer === normalizedGuess) return true;
    // Umlaut-tolerant: also accept raw umlauts
    if (guess.trim().toLowerCase() === answer.toLowerCase()) return true;
    // Allow 1 typo for words longer than 5 chars
    if (answer.length > 5 && levenshtein(normalizedAnswer, normalizedGuess) <= 1) return true;
    return false;
  });
}
```

**Archive pipeline:**
- watson.ch article database serves as source (~10K+ headlines, 2014–present)
- Puzzle editor curates via CMS tool:
  1. Browse/search watson archive by year, category, keyword
  2. Select headline → choose word to blank → add accepted answer variants → set difficulty
  3. System auto-checks: article URL still live? Headline not already used in past puzzle?
  4. Save to puzzle queue (target: 2-week buffer of pre-curated puzzles)
- **Fallback:** if no editor input by 22:00, system auto-generates from top-read articles per year. Blanks the longest proper noun. Flagged for manual review next day.
- **Archive health:** nightly job verifies all headline article URLs are reachable. Broken links flagged for replacement. Headlines with deleted articles excluded from selection pool.

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
    zaemesetzli: StreakData;
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

GET  /verbindige/today          → today's puzzle (Mundart words, no group labels or translations)
POST /verbindige/guess          → { puzzle_id, selected_items[] } → { correct, group?, hochdeutsch_label?, regions? }
GET  /verbindige/archive/:date  → past puzzle

GET  /zaemesetzli/today         → today's puzzle (emojis + canonical nouns + thresholds, no valid combinations)
POST /zaemesetzli/validate      → { puzzle_id, emoji_ids[], word } → { valid, in_puzzle, points, is_mundart }
GET  /zaemesetzli/archive/:date

GET  /schlagziil/today          → today's puzzle (headlines with blanks + years, no answers)
POST /schlagziil/guess          → { puzzle_id, headline_index, guess } → { correct, accepted_answer? }
GET  /schlagziil/hint           → { puzzle_id, headline_index } → { context_hint }
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
    zaemesetzli: `Zämesetzli #${number} 🧩`,
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
- Code-split per game (don't load Zämesetzli JS when playing Verbindige)
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
- Verbindige: Mundart words render correctly (special chars: ä, ö, ü, ch combinations). Tile truncation works for long dialect words.
- Zämesetzli: emoji rendering consistency across iOS, Android, Windows, macOS. Canonical noun hover/long-press works on all platforms. Compound word validation handles edge cases (3-part compounds, hyphenated compounds, Mundart variants).
- Schlagziil: answer normalization handles umlauts, typos, hyphenation, abbreviations. Archive URLs verified as live. Year/context clues render correctly.
- Offline: verify puzzle remains playable after network drop (after initial load). Zämesetzli requires server validation — queue guesses and validate on reconnect.
- Ad integration: verify game functions correctly when ad blocker is active (watson.ch already has ad blocker detection — games should work regardless)

---

## 9. Development Timeline

```
Week 1–2:   Project setup, design system tokens, shared components
            (game shell, nav integration, auth flow, API scaffolding)

Week 3–4:   Verbindige MVP (Mundart grid, selection, validation, group reveal with
            Hochdeutsch labels + regional origins, share)

Week 5–6:   Zämesetzli MVP (emoji pool, drag/tap combination, compound word input,
            server-side validation, scoring, rank system, hint system)

Week 7–8:   Schlagziil MVP (archive headline display with year/category, input,
            validation, hint system, article links, archive URL health check)

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
track('verbindige_group_solved', { puzzle_id, difficulty, group_label })

// Zämesetzli-specific
track('zaemesetzli_word_found', { puzzle_id, word, emoji_pair, is_mundart, points, difficulty })
track('zaemesetzli_rank_reached', { puzzle_id, rank })
track('zaemesetzli_hint_used', { puzzle_id, words_found_so_far })
track('zaemesetzli_emoji_noun_viewed', { puzzle_id, emoji }) // long-press/hover

// Schlagziil-specific
track('schlagziil_headline_solved', { puzzle_id, headline_index, attempts, year, hint_used })
track('schlagziil_article_clicked', { puzzle_id, headline_index, article_url, article_year })
track('schlagziil_hint_requested', { puzzle_id, headline_index })

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
