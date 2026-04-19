# Code Review Findings

## Review — 2026-04-19

### Branch: temp-holder (commits 29f7061..31bc00d)

15 commits covering: Buchstäbli removal, Supabase SDK swap to postgrest-js, localStorage game state persistence, streak tracking, reduced-motion support, ShareButton Web Share API, puzzle ID standardization, Schlagziil display answers, HeadlineCard key fix, Zämesetzli max_score correction.

**CRITICAL** (must fix before merge):

1. `transform: none !important` in reduced-motion media query breaks layout positioning.
   - File: `src/styles/tokens.css:109`
   - Problem: The rule `transform: none !important` inside `@media (prefers-reduced-motion: reduce)` kills ALL CSS transforms, including layout transforms used for centering. `src/components/shared/Toast.tsx:44` uses `-translate-x-1/2` (compiles to `transform: translateX(-50%)`) on a `left-1/2` positioned element — this centers the toast container. With `transform: none !important`, the toast appears at left 50% with no offset, rendering it off-center and partially clipped on mobile. Same issue in `src/games/zaemesetzli/EmojiPool.tsx:34` where a tooltip uses `-translate-x-1/2` for centering.
   - Suggested fix: Remove `transform: none !important`. The existing `animation-duration: 0.01ms` and `transition-duration: 0.01ms` already disable motion. For button press effects (`active:scale-[0.97]`), these are transition-driven and already neutered by the 0.01ms transition-duration. Alternatively, scope the transform override to animation keyframes only, not to static layout transforms.

**WARNING** (should fix):

1. Streak `isConsecutiveDay()` breaks across DST transitions.
   - File: `src/lib/useStreak.ts:24-28`
   - Problem: `isConsecutiveDay` compares two YYYY-MM-DD dates by parsing `new Date(prev + 'T00:00:00')` (local timezone) and checking if the diff is exactly `86_400_000` ms. Across a DST boundary (e.g., CET → CEST on 2026-03-29), midnight-to-midnight is 23 hours (82_800_000 ms), not 24. A player with an active streak who plays on both sides of a DST transition would have their streak broken despite playing on consecutive calendar days.
   - Suggested fix: Compare dates arithmetically (parse YYYY-MM-DD, compare year/month/day) or use UTC parsing (`new Date(prev + 'T00:00:00Z')`).

2. Zämesetzli streak triggers on first found word, not game completion.
   - File: `src/games/zaemesetzli/ZaemesetzliPage.tsx:49-52`
   - Problem: `recordPlay` fires when `foundWords.length > 0`, meaning finding a single word records the streak. Verbindige and Schlagziil record on game completion (`status === 'won' || 'lost'` / `status === 'finished'`). This inconsistency means a Zämesetzli player who finds one word and abandons gets streak credit, while a Verbindige player who solves 3/4 groups and quits does not.
   - Suggested fix: Add a completion condition to Zämesetzli (e.g., all words found, or a time/attempt threshold) and trigger streak recording there.

3. localStorage game state accumulates indefinitely.
   - File: `src/lib/gameStorage.ts`
   - Problem: Keys like `watson_verbindige_2026-04-19` are written daily but never cleaned up. Over months, hundreds of entries accumulate. localStorage has a ~5MB limit per origin. Each entry is small (~200 bytes) so this won't hit the limit soon, but it's unbounded growth.
   - Suggested fix: On save, prune entries older than 30 days for the same game type. Or use a single key per game with a rolling window.

**NOTE** (consider):

1. Puzzle identifier now shows raw ISO date in header (e.g., `#2026-04-19`).
   - File: `src/components/shared/GameHeader.tsx:13`
   - Problem: The `puzzleId` is passed as the raw `puzzle.date` string. The header renders `#2026-04-19` which is technically correct but not user-friendly. Consider a shorter format like `#19.04.` (Swiss convention) or a sequential puzzle number fetched from the database.

2. `postgrest-js` version `^2.103.3` may not exist as a standalone package at that version.
   - File: `package.json`
   - Problem: The `@supabase/postgrest-js` package follows its own versioning (currently around v1.x). Version `^2.103.3` looks like it was carried over from the `@supabase/supabase-js` version number. Verify this resolves correctly in `package-lock.json` and that the build succeeds.

3. Streak badge (🔥) uses emoji which may render inconsistently across platforms.
   - File: `src/components/shared/GameHeader.tsx:17`
   - Problem: The fire emoji in the streak badge may render differently on Android vs iOS vs desktop. Consider using a CSS-drawn icon or SVG for consistency. Minor cosmetic concern.

4. RankBar moved from `src/games/buchstaebli/` to `src/components/shared/` — good refactor since it's now used by Zämesetzli only. The `thresholds` prop remains unused (existing P1 from Buchstäbli QA still applies).

## Last Reviewed
- temp-holder: 31bc00d
