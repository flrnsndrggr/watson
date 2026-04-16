## Architecture Review — 2026-04-16

### Cross-Game Consistency

**Compliant:**
- All 4 games follow the required file structure: `<Game>Page.tsx`, `use<Game>.ts`, `<game>.data.ts`.
- `GameShell` wraps all 4 game pages correctly.
- `GameHeader` used consistently across all 4 games.
- `ShareButton` used in all 4 games (VerbindigeResult, SchlagziilResult, ZaemesetzliPage, BuchstaebliPage).
- `showToast` used in Verbindige, Zaemesetzli, Buchstaebli; Schlagziil appropriately omits it (inline card feedback).
- `ErrorDots` used only where applicable (Verbindige, Schlagziil) — not forced on rank-based games.

**Gaps:**
- **[P0] Buchstaebli has no route in `src/App.tsx`.** The game exists at `src/games/buchstaebli/` but is unreachable. Already filed in ROADMAP (#1 Buchstäbli QA Findings).
- **[P1] No `AdminBuchstaebli` page.** `src/pages/admin/` has AdminVerbindige, AdminZaemesetzli, AdminSchlagziil but no equivalent for Buchstaebli. Admin router at `src/App.tsx:33` also has no `/admin/buchstaebli` route.
- **[P2] Buchstaebli absent from landing page.** Confirm `src/pages/LandingPage.tsx` links to all four games — Buchstaebli may be missing a card since the route doesn't exist yet.

---

### Design Token Compliance

**Compliant:**
- All watson brand colors used via `var(--color-*)` in every game component. No hardcoded hex brand values in `.tsx` files.
- Font families declared only in `tokens.css` — no inline `font-family` strings in components.

**Violations:**
- **[P2] Admin pages use 3 hardcoded hex colors:**
  - `src/pages/admin/AdminLayout.tsx:18` — `bg-[#f5f5f5]` (should use `bg-[var(--color-gray-bg)]` or Tailwind neutral)
  - `src/pages/admin/AdminDashboard.tsx:69` — `bg-[#f0fdf4]` (Tailwind `bg-green-50` equivalent — no token)
  - `src/pages/admin/AdminDashboard.tsx:73` — `bg-[#fffbeb]` (Tailwind `bg-yellow-50` equivalent — no token)
- **[P2] `HeadlineCard.tsx:52-53`** uses `bg-green-50` and `bg-pink-50` — Tailwind defaults, not design tokens. These blend ok with token border colors but diverge from the token system.

---

### Code Duplication

**P1 — `shuffleArray<T>` duplicated:**
- `src/games/verbindige/useVerbindige.ts:26-33`
- `src/games/buchstaebli/useBuchstaebli.ts:38-45`
- Identical implementation. Extract to `src/lib/utils.ts` and import in both hooks.

**P1 — `getRank()` duplicated:**
- `src/games/buchstaebli/useBuchstaebli.ts:30-36` (takes `BuchstaebliPuzzle['rank_thresholds']`)
- `src/games/zaemesetzli/useZaemesetzli.ts:28-34` (takes `ZaemesetzliPuzzle['rank_thresholds']`)
- Both thresholds share the same 5 keys (`bundesrat`, `meister`, `geselle`, `lehrling`, `stift`). Extract a shared `getRank(score: number, thresholds: RankThresholds): Rank` to `src/lib/utils.ts` with a `RankThresholds` type in `src/types/index.ts`.

**P2 — `normalize()` + `levenshtein()` inline in game hook:**
- `src/games/schlagziil/useSchlagziil.ts:23-50` — 30 lines of utility code inside a game-specific file.
- Move to `src/lib/utils.ts`; schlagziil imports them from there.

**P2 — No Supabase integration in any game hook yet:**
- All 4 hooks load from static `SAMPLE_*` / `DEMO_*` fixtures. Supabase client exists at `src/lib/supabase.ts` but is unused from game code.
- When adding live data fetching, use a single `src/lib/puzzles.ts` module with typed fetch functions per game to prevent divergent query patterns across hooks.

---

### Accessibility

**Compliant:**
- `prefers-reduced-motion` handled globally in `src/styles/tokens.css:90-95` — all animations and transitions disabled at OS level. No component-level handling needed.

**Gaps:**
- **[P1] No keyboard navigation in Verbindige, Schlagziil, or Zaemesetzli.**
  - Buchstaebli has a full `keydown` listener at `src/games/buchstaebli/BuchstaebliPage.tsx:55-70`.
  - Verbindige tiles (`src/games/verbindige/VerbindigeTile.tsx`) suppress tap highlight but have no `onKeyDown` or `role="button"` — keyboard users cannot select tiles.
  - Schlagziil's guess input (`src/games/schlagziil/HeadlineCard.tsx`) likely relies on native `<input>` Enter — confirm Enter submits; the hint button needs keyboard support.
  - Zaemesetzli emoji pool buttons (`src/games/zaemesetzli/EmojiPool.tsx`) need `onKeyDown` for Space/Enter activation.

- **[P1] Insufficient ARIA labels on interactive elements:**
  - Only 1 `aria-label` found across all 4 game directories (`EmojiPool.tsx:30` — emoji item).
  - Verbindige tiles, Schlagziil hint buttons, Zaemesetzli combine slots, Buchstaebli hex letter buttons all lack `aria-label`.

- **[P2] Schlagziil progress dots are color-only indicators.**
  - `src/games/schlagziil/SchlagziilPage.tsx:54-66`: 5 colored dots (green=correct, pink=wrong, cyan=current, gray=pending) convey state through color alone.
  - Add `aria-label` per dot, e.g. `aria-label="Headline 1: richtig"`.

- **[P2] Touch target audit partially passing:**
  - Zaemesetzli combine slots: `h-12 w-12` (48px) — compliant.
  - Buchstaebli input display is `h-12` — compliant.
  - Verbindige tiles: no explicit min-height — verify rendered height ≥ 44px.
  - Buchstaebli action buttons (`src/games/buchstaebli/BuchstaebliPage.tsx:104-123`): `py-2` without `min-h-11` — may fall below 44px on small text.

---

### Bundle & Types

- **Build:** Clean. 291.73 kB JS (90.34 kB gzip), 28.24 kB CSS (6.20 kB gzip). No warnings.
- **TypeScript:** Clean. Zero errors on `tsc -b`.
- **`any` types:** None found.
- **Dependencies:** All 6 runtime deps appear used. `canvas-confetti` used only in `VerbindigePage.tsx` — if other games add win celebrations, consider a shared `src/lib/confetti.ts` wrapper.

---

### Recommendations (prioritized)

1. **[P0] Wire up Buchstaebli route** — add `<Route path="buchstaebli" element={<BuchstaebliPage />} />` in `src/App.tsx:26` block. (Already in ROADMAP; architectural blocker for the game's entire existence.)

2. **[P1] Extract `shuffleArray` and `getRank` to `src/lib/utils.ts`** — eliminates the two highest-impact duplications. Define `RankThresholds` type in `src/types/index.ts` so the shared `getRank` is typesafe. Estimated: ~30 lines removed across 3 files.

3. **[P1] Keyboard navigation for Verbindige and Zaemesetzli** — add `window.addEventListener('keydown', ...)` in each Page component following the Buchstaebli pattern. For Verbindige: Enter = submitGuess, Backspace = clearSelection, letter keys = no-op (tiles are click-based). For Zaemesetzli: Enter = submitWord, Backspace = clearEmojiSelection.

4. **[P1] ARIA labels on all interactive elements** — minimum viable: add `aria-label` to tile/hex buttons and game action buttons across all 4 games. Target files: `VerbindigeTile.tsx`, `HexGrid.tsx`, `EmojiPool.tsx`, `CombineSlots.tsx`, and action buttons in each `*Page.tsx`.

5. **[P1] Add AdminBuchstaebli page** — create `src/pages/admin/AdminBuchstaebli.tsx` following the pattern of `AdminZaemesetzli.tsx`, add route `/admin/buchstaebli` in `src/App.tsx:33`.

6. **[P2] Fix admin hardcoded hex colors** — replace `#f5f5f5` in AdminLayout with `bg-gray-100`, replace `#f0fdf4`/`#fffbeb` with Tailwind semantic classes or add `--color-status-success-bg`/`--color-status-warning-bg` tokens.

7. **[P2] Plan `src/lib/puzzles.ts`** — before any Supabase integration lands in game hooks, define typed fetch functions per game table here. Prevents each hook from writing its own query pattern.

8. **[P2] Schlagziil progress dot ARIA labels** — `src/games/schlagziil/SchlagziilPage.tsx:54-66`, add `aria-label` to each dot describing its state.
