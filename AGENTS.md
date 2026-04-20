# games-watson Agent Operating Contract

All scheduled agents working on this project MUST follow these rules.

## Project Context

- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Supabase
- **Deployment:** Netlify (`games-watson.netlify.app`, site ID `cfaa1817-72f7-47cd-8a95-8c998529bcf9`)
- **Supabase:** project `fosnshalcgwvatejpdok`
- **Repo:** `/Users/fs/Code/game-watson`
- **Production URL:** https://games-watson.netlify.app

## Brand Immutables (NEVER change)

These are locked brand elements extracted from watson.ch:

| Element | Value | Notes |
|---|---|---|
| Primary cyan | `#00C6FF` | Interactive elements, selected states, CTAs |
| Secondary pink | `#F40F97` | Success states, streak highlights, celebrations |
| Tertiary green | `#7BD400` | Correct answers, positive feedback |
| Accent blue | `#0F6CF5` | Hard difficulty, tertiary accent |
| Body font | `"Nunito Sans"` | All body text |
| Heading font | `"Onest"` | Headings, game titles |
| Game max-width | `600px` | Games are focused, not full-width |

Do NOT change these values in `src/styles/tokens.css` or anywhere else.

## File Conventions

```
src/
  components/shared/    # Shared UI (GameShell, Toast, ShareButton, etc.)
  games/<game>/         # Game-specific components + hooks + data
  pages/                # Layout, LandingPage
  pages/admin/          # Admin panel (AdminLayout, AdminDashboard, per-game editors)
  lib/                  # Supabase client, auth context, Idiotikon API client, share utils
  styles/               # Design tokens
  types/                # Shared TypeScript types
docs/
  CHANGELOG.md          # Changelog maintained by watson-docs agent
  polish-checklist.md   # UX polish items for watson-game-polish agent
  feature-backlog.md    # Feature backlog for watson-feature-worker agent
ROADMAP.md              # QA findings + issue tracker
MUNDART-SOURCING.md     # Mundart word sourcing pipeline (Idiotikon → word bank → puzzles)
scripts/
  seed-from-idiotikon.ts   # Fetches verified Mundart words from Idiotikon API
  mundart-word-bank.json   # 79+ pre-fetched verified words
```

## Git Rules

1. **Branch from main** for all work: `fix/roadmap-{N}`, `polish/incremental`, `feature/backlog`
2. **Never force-push** (`--force`, `--force-with-lease`)
3. **Never amend** published commits
4. **Never skip hooks** (`--no-verify`)
5. **Stage specific files** (never `git add -A` or `git add .`)
6. **Commit message format:**
   ```
   <type>: <short description>

   <optional body>

   Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
   ```
   Types: `fix`, `feat`, `polish`, `content`, `docs`, `triage`, `review`

## Build Verification

Before committing, run:
```bash
npx tsc -b           # TypeScript check
npm run lint          # ESLint
npm run build         # Vite production build
```

If any fails, revert changes and mark the item with `[!]` + reason.

## Game Types

| Game | Route | Admin Route | Key Files |
|---|---|---|---|
| Verbindige | `/verbindige` | `/admin/verbindige` | `src/games/verbindige/` |
| Schlagziil | `/schlagziil` | `/admin/schlagziil` | `src/games/schlagziil/` |
| Zämesetzli | `/zaemesetzli` | `/admin/zaemesetzli` | `src/games/zaemesetzli/` |

## Supabase Tables

- `puzzles` — parent table (id, game_type, publish_date)
- `verbindige_puzzles` — groups JSONB
- `schlagziil_puzzles` — headlines JSONB
- `zaemesetzli_puzzles` — emojis, valid_compounds, rank_thresholds
- `game_sessions` — user play history
- `user_profiles` — accounts
- `streaks` — per-game streak tracking

## Difficulty Colors (Verbindige)

| Level | Color | CSS var |
|---|---|---|
| 1 (easy) | Yellow `#FFD700` | `--color-difficulty-1` |
| 2 (medium) | Green `#7BD400` | `--color-difficulty-2` |
| 3 (hard) | Blue `#0F6CF5` | `--color-difficulty-3` |
| 4 (tricky) | Purple `#9B59B6` | `--color-difficulty-4` |
