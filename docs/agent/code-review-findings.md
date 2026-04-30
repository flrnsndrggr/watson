# Code Review Findings

## Review — 2026-04-29

### Branch: cms (commits d0f5410..7b3ec76)

2 commits: lost-game share gray squares for auto-revealed Verbindige groups (`7b3ec76`), weekly architecture review update (`d0f5410`).

**CRITICAL** (must fix before merge):

_None._

**WARNING** (should fix):

1. `#555555` gray for `revealedOnLoss` tiles on share card may lack sufficient contrast against `#1A1A1A` background.
   - File: `src/lib/shareImage.ts:19,203,520`
   - Problem: The share card background is `#1A1A1A` (dark). The `revealedOnLoss` gray is `#555555`. The contrast ratio is ~3.0:1, which falls below WCAG AA's 3:1 minimum for non-text UI components. On the text-based emoji share (`⬛⬛⬛⬛`), this is fine — black squares are universally understood. But on the canvas share image, the gray-on-dark tiles may be hard to distinguish as intentionally "lost" vs. just dimmed.
   - Suggested fix: Use a lighter gray (e.g., `#888888` or `C.gray` which is `#777777`) for the loss tiles in the share image, or add a subtle border/pattern to differentiate them from the background.

2. `revealedOnLoss` is optional (`revealedOnLoss?: boolean`) in the `ShareCardGrid` type but not guarded in the emoji path.
   - File: `src/games/verbindige/VerbindigeResult.tsx:151`
   - Problem: The ternary `g.revealedOnLoss ? '⬛⬛⬛⬛' : ...` correctly handles `undefined` (falsy → colored emoji). However, the `ShareCardGrid` type at `shareImage.ts:49` marks `revealedOnLoss` as optional. If a future caller constructs a grid without the flag, the behavior is correct (falls through to colored), but a stricter type (`revealedOnLoss: boolean`) would make the intent explicit and prevent accidental omissions.
   - Suggested fix: Change `revealedOnLoss?: boolean` to `revealedOnLoss: boolean` in the `ShareCardGrid` type, and ensure all callers set it explicitly.

**NOTE** (consider):

1. Architecture review findings in `ROADMAP.md` and `docs/agent/architect-report.md` are documentation-only changes — no code review concerns.

2. The `docs/polish-checklist.md` correctly marks the lost-game share item as completed with date `2026-04-29`. Consistent with the implementation in this branch.

3. The implementation cleanly threads `revealedOnLoss` through the existing data flow: `useVerbindige.ts` sets the flag → `VerbindigeBoard.tsx` filters by it → `VerbindigeResult.tsx` uses it for both emoji text and share image grid → `shareImage.ts` renders gray tiles. Good separation of concerns.

---

## Review — 2026-04-19

### Branch: temp-holder (commits 29f7061..31bc00d)

15 commits covering: Buchstäbli removal, Supabase SDK swap to postgrest-js, localStorage game state persistence, streak tracking, reduced-motion support, ShareButton Web Share API, puzzle ID standardization, Schlagloch display answers, HeadlineCard key fix, Zämesetzli max_score correction.

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
   - Problem: `recordPlay` fires when `foundWords.length > 0`, meaning finding a single word records the streak. Verbindige and Schlagloch record on game completion (`status === 'won' || 'lost'` / `status === 'finished'`). This inconsistency means a Zämesetzli player who finds one word and abandons gets streak credit, while a Verbindige player who solves 3/4 groups and quits does not.
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

---

## Review — 2026-04-19 (incremental)

### Branch: temp-holder (commits 31bc00d..90cc78d)

3 commits: ErrorDots pulse animation, code review findings commit, release verification.

**CRITICAL** (must fix before merge):

_None._

**WARNING** (should fix):

1. `error-dot-pulse` keyframe uses `transform: scale()` — interacts with existing CRITICAL (transform: none !important).
   - File: `src/styles/tokens.css:104-108`
   - Problem: The new `@keyframes error-dot-pulse` uses `transform: scale(1.5)` at 50%. This animation is correctly neutered under `prefers-reduced-motion` by the existing `animation-duration: 0.01ms !important` rule, so accessibility is fine. However, if the CRITICAL `transform: none !important` issue from the previous review remains unfixed, it would also affect this animation's scale transform during playback — though that's moot since the animation-duration rule fires first. No new breakage, but this is another reason to fix the CRITICAL from the prior review.
   - Suggested fix: Fix the original CRITICAL (remove `transform: none !important`); no changes needed to the pulse animation itself.

**NOTE** (consider):

1. React key-based remount trick for re-triggering animation is correct but slightly unusual.
   - File: `src/components/shared/ErrorDots.tsx:13`
   - Problem: `key={isLatest ? \`dot-${i}-${used}\` : i}` forces React to destroy and recreate the DOM node when a dot becomes "latest", re-triggering the CSS animation. This is a valid pattern, but when `used` increments, the previously-latest dot also remounts (its key changes from the dynamic form back to just `i`). For simple `<span>` elements with no state this is harmless, but worth a comment explaining the intent for future maintainers.

2. ErrorDots pulse animation not tested with screen readers.
   - File: `src/components/shared/ErrorDots.tsx`
   - Problem: The error dots have no ARIA attributes. Screen readers won't announce when a new error occurs. Consider `aria-live="polite"` on the container and an `aria-label` like `"Fehler: {used} von {total}"` so error progression is accessible to non-visual users. (This predates this commit but is worth noting alongside the visual enhancement.)

---

## Review — 2026-04-19 (incremental 2)

### Branch: temp-holder (commits 90cc78d..87dbe18)

2 application commits: AdSlot placeholder styling (`41077ee`), Schlagloch wrong-answer shake feedback (`87dbe18`).

**CRITICAL** (must fix before merge):

_None._

**WARNING** (should fix):

1. Shake animation on HeadlineCard uses `transform: translateX()` — broken under existing `transform: none !important` reduced-motion rule.
   - File: `src/styles/tokens.css:49-53` (shake keyframe), `src/games/schlagloch/HeadlineCard.tsx:58`
   - Problem: The `shake` keyframe uses `transform: translateX(±8px)`. The existing CRITICAL from the first review (`transform: none !important` in the `prefers-reduced-motion` media query at `tokens.css:116`) kills this animation's visual effect entirely — the transform is overridden to `none`. The `animation-duration: 0.01ms !important` rule fires first, so the animation is already effectively hidden for reduced-motion users (correct). However, this is yet another transform-based animation affected by the `transform: none !important` rule. This reinforces the urgency of fixing the original CRITICAL.
   - Suggested fix: Fix the original CRITICAL (remove `transform: none !important`). No changes needed to the shake animation itself.

2. `wrongFlash` state is not scoped to the current headline — all headlines would flash if rendered simultaneously.
   - File: `src/games/schlagloch/SchlaglochPage.tsx:45,113-118`
   - Problem: `wrongFlash` is a single boolean in SchlaglochPage state, passed to the HeadlineCard at `currentIndex`. Currently only one HeadlineCard renders at a time (the active one), so this works. But if the layout ever changes to show multiple headlines (e.g., a grid view, or showing the previous card during transition), all visible cards would receive the same `wrongFlash` prop. Low risk since the current UI is single-card, but the state should ideally be scoped (e.g., `wrongFlashIndex: number | null`).
   - Suggested fix: Store `wrongFlashIndex` instead of a boolean, and only pass `wrongFlash={wrongFlashIndex === currentIndex}` to HeadlineCard.

**NOTE** (consider):

1. Schlagloch wrong-answer feedback resolves ROADMAP P1 item #2 (Schlagloch section).
   - File: `ROADMAP.md:94-100`
   - The implementation matches the suggested fix exactly: `useEffect` on `lastGuessResult === 'wrong'`, shows toast ("Falsch!"), passes `wrongFlash` prop for red-border + shake animation. This ROADMAP item can be marked as resolved once the branch merges.

2. AdSlot uses `text-[10px]` which is below WCAG minimum recommended font size.
   - File: `src/components/shared/AdSlot.tsx:17`
   - Problem: The "Anzeige" label uses `text-[10px]` (10px font size). WCAG does not mandate a minimum font size, but 10px is difficult to read for many users, especially on mobile. Since this is a placeholder label on an ad slot, readability is less critical, but consider `text-[11px]` or `text-xs` (12px) for better legibility.

3. AdSlot placeholder lacks `role` or `aria-label` to indicate it's an ad placeholder.
   - File: `src/components/shared/AdSlot.tsx:14`
   - Problem: Screen readers will encounter a container with just the text "Anzeige" and no semantic role. Consider `role="complementary"` or `aria-label="Werbefläche"` so assistive technology can identify and skip the ad region.

4. AdSlot uses watson design tokens correctly (`--color-gray-bg`, `--color-gray-text`, `--game-tile-radius`) — good brand compliance.

## Last Reviewed
- cms: 7cc4d52
- temp-holder: 87dbe18
