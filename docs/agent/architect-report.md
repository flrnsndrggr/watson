## Architecture Review — 2026-04-29

_Previous review: 2026-04-16. This review covers all 6 games._

### Cross-Game Consistency

**Compliant:**
- All 6 games follow the required file structure: `<Game>Page.tsx`, `use<Game>.ts`, `<game>.data.ts`, `<Game>Result.tsx`.
- `GameShell` wraps all 6 game pages consistently.
- `GameHeader` used in all 6 game pages.
- `ShareButton` used in all 6 Result components.
- `ErrorDots` used only where applicable (Verbindige, Schlagloch) — quiz/rank games appropriately omit it.

**Structure by game:**

| Game | Files | Extras | Notes |
|---|---|---|---|
| Verbindige | 8 | Board, Tile, SolvedGroup, EditionPage | Most complex; has special edition variant |
| Schlagloch | 5 | HeadlineCard | Moderate complexity |
| Zämesetzli | 6 | EmojiPool, CombineSlots | Uses RankBar instead of ErrorDots; has AdSlot |
| Quizzhuber | 4 | — | Minimal (quiz format) |
| Aufgedeckt | 4 | — | Minimal; GuessForm inline in Page |
| Quizzticle | 4 | — | Minimal (timed list-fill) |

**Minor inconsistencies:**
- Toast usage varies: Verbindige uses it from the hook, Schlagloch/Zaemesetzli from the page, Quizzhuber/Aufgedeckt/Quizzticle don't use it. Not a bug — quiz games have simpler feedback needs.
- Aufgedeckt defines `GuessForm` inline in `AufgedecktPage.tsx` rather than as a separate component file. Consider extracting if it grows.

---

### Design Token Compliance

**Compliant:**
- All watson brand colors (#00C6FF, #F40F97, #7BD400, #0F6CF5) used exclusively via `var(--color-*)` in game components. No direct hex in `.tsx`.
- Font families (Nunito Sans, Onest) declared only in `tokens.css`.
- Canvas share card (`src/lib/shareImage.ts`) hardcodes brand hex values for Canvas API rendering — justified exception, values mirror tokens.

**Violations (carried over from 2026-04-16, still open):**

- **[P2] Admin hardcoded grays:**
  - `src/pages/admin/AdminLayout.tsx:23` — `bg-[#f5f5f5]`
  - `src/pages/admin/AdminSchedule.tsx:76` — `bg-[#f5f5f5]`
  - Fix: Replace with `bg-[var(--color-gray-bg)]` or Tailwind `bg-gray-100`.

- **[P2] RGBA brand color variants hardcoded in 2 files:**
  - `src/games/schlagloch/SchlaglochResult.tsx:133-134` — `rgba(123, 212, 0, 0.06)` / `rgba(244, 15, 151, 0.06)`
  - `src/games/aufgedeckt/AufgedecktPage.tsx:122` — identical RGBA values
  - Fix: Add `--color-green-tint-06` and `--color-pink-tint-06` tokens to `tokens.css`.

- **[P3] Shimmer gradient in `src/components/shared/PuzzleLoading.tsx:11`** — inline `#f5f5f5`.
  - Fix: Add `--color-gray-shimmer` token.

---

### Code Duplication

**[P1] Game completion flow duplicated across all 6 hooks:**
All game hooks duplicate a ~30-line completion chain: `recordGamePlayed()` → `submitLeaderboardEntry()` → `triggerAccountPrompt()` → `checkAchievements()` → `saveDailyResult()` → `clearGameProgress()`. Each also has an identical `persist()` guard pattern.
- Files: all 6 `use<Game>.ts` hooks
- Fix: Extract `useGameCompletion(gameType, score, elapsed)` shared hook.

**[P1] Text normalization duplicated 3×:**
- `src/games/aufgedeckt/useAufgedeckt.ts:61-67` — `normalize()` (simple: ä→a)
- `src/games/quizzticle/useQuizzticle.ts:52-58` — identical
- `src/games/schlagloch/useSchlagloch.ts:74-83` — variant (ä→ae + levenshtein)
- Fix: Extract to `src/lib/textNormalization.ts` with parametric normalization.

**[P2] Tailwind button classes repeated 8+ times:**
- Primary cyan button pattern repeated in Aufgedeckt, Quizzhuber, Verbindige, VerbindigeEdition.
- Secondary border button pattern repeated in Verbindige, VerbindigeEdition.
- Fix: Create `<PrimaryButton>` / `<SecondaryButton>` in `src/components/shared/Button.tsx`.

**[P2] Result screen layout pattern duplicated 6×:**
All Result components share identical structure: title → verdict → score → StreakBadge → ShareButton → LeaderboardPanel.
- Fix: Create `<GameResultScreen>` wrapper accepting game-specific slots.

**[P2] Supabase query duplication:**
- `fetchTodaysPuzzle()` and `fetchPuzzleByDate()` in `src/lib/supabase.ts` share identical two-step query logic.
- Fix: Extract shared `fetchPuzzleWithData<T>(gameType, date?)` helper.

**Resolved since last review:**
- ~~`shuffleArray` duplication~~ — Now exists only in `useVerbindige.ts:69`. No cross-game duplication.

---

### Accessibility

**Improvements since 2026-04-16:**
- ARIA labels significantly expanded — all game tiles/buttons now have `aria-label` and `aria-pressed` where applicable (Verbindige, Zaemesetzli).
- `role="region"`, `role="status"`, `role="tablist"`, `role="dialog"` properly used.
- Focus-visible styles defined globally in `tokens.css:242-250`.
- `prefers-reduced-motion` handled globally in `tokens.css:301-307`.

**Remaining gaps:**

- **[P1] Zaemesetzli drag-drop has no keyboard alternative.**
  - `src/games/zaemesetzli/EmojiPool.tsx:42-51` — drag handlers only, no `onKeyDown`.
  - `src/games/zaemesetzli/CombineSlots.tsx:23-40` — drop targets only.
  - Keyboard-only users cannot play Zaemesetzli.
  - Fix: Add click-to-select + Enter-to-confirm as keyboard alternative to drag-drop.

- **[P1] Touch targets undersized in shared components:**
  - `src/components/shared/PlayCalendar.tsx:168,183` — month nav buttons ~30px (need ≥44px).
  - `src/components/shared/LeaderboardPanel.tsx:64` — tab buttons ~20px height (need ≥44px).
  - Fix: Add `min-h-[44px] min-w-[44px]` to these interactive elements.

- **[P2] Color-only state indicators in multiple games:**
  - Quizzhuber answer options: selection state via border color only (`QuizzhuberPage.tsx:85-90`).
  - Verbindige tiles: selected/wrong state via color only (`VerbindigeTile.tsx:81-83`).
  - LeaderboardPanel tabs: active state via background color only (`LeaderboardPanel.tsx:64-68`).
  - Fix: Add icons or patterns alongside color changes (checkmark on selected, underline on active tab).

- **[P2] Missing `aria-live` regions in 4 games:**
  - Only Schlagloch has `aria-live="polite"` (`HeadlineCard.tsx:77`).
  - Aufgedeckt, Quizzhuber, Verbindige, Zaemesetzli lack live regions for real-time feedback.
  - Fix: Add `aria-live="polite"` to feedback containers.

- **[P2] Emoji-only buttons missing aria-labels:**
  - `src/games/aufgedeckt/AufgedecktPage.tsx:175-181` — submit button with "→" only.
  - `src/games/schlagloch/HeadlineCard.tsx:137-142` — hint button with "💡" only.

- **[P2] `usePrefersReducedMotion` hook imported but unused:**
  - `src/games/verbindige/VerbindigePage.tsx:13,38` — hook called, return value not used.
  - Shuffle animation runs regardless of user preference.

- **[P2] NotificationSettings toggle missing `aria-checked`:**
  - `src/components/shared/NotificationSettings.tsx:81` — has `role="switch"` but no `aria-checked`.

---

### Bundle & Types

- **Build:** Clean. No warnings. Total JS: ~650 kB uncompressed across all chunks. Largest: `vendor-react` (232 kB / 74 kB gzip), `vendor-supabase` (107 kB / 27 kB gzip).
- **TypeScript:** Clean. Zero errors on `tsc -b`.
- **`any` types (7 instances):**
  - `src/lib/cmsApi.ts:53` — `catch (err: any)` — use `unknown`
  - `src/lib/cmsApi.ts:57` — `let json: any` — type the response shape
  - `src/lib/cmsApi.ts:97-98` — `game: any` in return type — define per-game union
  - `src/lib/stubs/supabase-realtime-stub.ts:13-14` — stub returns `any` — acceptable for stub
  - `src/components/admin/forms/JsonModeToggle.tsx:26` — `catch (e: any)` — use `unknown`
- **Dependencies:** All used. `@supabase/postgrest-js` listed separately from `@supabase/supabase-js` — verify it's needed independently (supabase-js re-exports postgrest).

---

### Recommendations (prioritized)

1. **[P1] Extract shared game completion hook** — 6 hooks duplicate ~30 lines of completion flow each. Create `useGameCompletion()` in `src/lib/` to handle `recordGamePlayed` → `submitLeaderboardEntry` → `triggerAccountPrompt` → `checkAchievements` → `saveDailyResult` → `clearGameProgress`. Estimated: ~180 lines of duplication removed.

2. **[P1] Add keyboard alternative for Zaemesetzli** — drag-drop is the only interaction path. Add click-to-select on emoji pool items + Enter to confirm in combine slots. Files: `EmojiPool.tsx`, `CombineSlots.tsx`.

3. **[P1] Fix undersized touch targets** — `PlayCalendar.tsx` nav buttons and `LeaderboardPanel.tsx` tabs are well below WCAG 44px minimum. Add `min-h-[44px] min-w-[44px]`.

4. **[P1] Extract text normalization to shared module** — 3 copies of `normalize()` across games. Create `src/lib/textNormalization.ts`. Reduces duplication and centralizes Swiss-German character handling.

5. **[P2] Create shared button components** — Primary/secondary button patterns repeated 8+ times. Extract to `src/components/shared/Button.tsx`.

6. **[P2] Create `GameResultScreen` wrapper** — 6 result components share identical layout skeleton. Wrapper accepts title, verdict, score, and game-specific content as slots.

7. **[P2] Add RGBA brand tint tokens** — `--color-green-tint-06` and `--color-pink-tint-06` to replace hardcoded RGBA values in `SchlaglochResult.tsx` and `AufgedecktPage.tsx`.

8. **[P2] Add `aria-live` regions to remaining 4 games** — currently only Schlagloch has live feedback announcements.

9. **[P2] Replace `any` types in `cmsApi.ts`** — 4 instances; use `unknown` for catches, define proper response types.

10. **[P2] Verify `@supabase/postgrest-js` independence** — may be redundant with `@supabase/supabase-js`.
