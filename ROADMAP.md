# games-watson Roadmap

## Priority Guide

- **P0:** Crashes, data corruption, completely broken game mechanics, deploy failures
- **P1:** Confusing UX, misleading wording, significant visual bugs, incorrect scoring/validation
- **P2:** Minor wording improvements, small visual polish, nice-to-have UX tweaks

## Format

```
N. [ ] P{0|1|2} - {Short title}
   - Agent: {agent name}
   - Scenario: {what was being tested}
   - Problem: {what was observed}
   - Suggested fix: {concrete suggestion}
   - Files: {likely files to edit}
   - Evidence: {what the agent saw}
```

Mark completed items as `[x]`. Mark duplicates as `[-] Duplicate of #{N}`.
Mark items needing human input as `[!] {reason}`.

---

## Verbindige QA Findings

_Items from watson-qa-verbindige agent_

---

## Buchstäbli QA Findings

_Items from watson-qa-buchstaebli agent_

1. [x] P0 - Route `/buchstaebli` does not exist — blank white screen
   - Agent: watson-qa-buchstaebli
   - Scenario: First Play — navigate directly to https://games-watson.netlify.app/buchstaebli
   - Problem: The route `/buchstaebli` is not registered in the React Router config. Navigating to it produces a blank white page with no content or error message shown to the user.
   - Suggested fix: Add a `<Route path="/buchstaebli" element={<BuchstaebliPage />} />` entry in the router (likely `src/App.tsx` or equivalent routing file). The game files exist at `src/games/buchstaebli/` per AGENTS.md but the route is missing.
   - Files: `src/App.tsx` (or router config), `src/games/buchstaebli/`
   - Evidence: Console warning "No routes matched location '/buchstaebli'" (React Router). Page renders empty white body. Observed 2026-04-16.

2. [x] P1 - Buchstäbli absent from landing page nav and game card list
   - Agent: watson-qa-buchstaebli
   - Scenario: First Play — navigating from landing page to discover games
   - Problem: The landing page shows Verbindige, Zämesetzli and Schlagziil as clickable game cards. The nav bar also links only to those three games. Buchstäbli has no card and no nav entry, so a real user can never discover it from the homepage.
   - Suggested fix: Add a Buchstäbli game card in `LandingPage.tsx` and a nav link in the Layout/nav component, matching the pattern used by the other three games.
   - Files: `src/pages/LandingPage.tsx`, `src/pages/Layout.tsx` (or wherever nav links live)
   - Evidence: Accessibility tree of https://games-watson.netlify.app shows nav with only `/verbindige`, `/zaemesetzli`, `/schlagziil`. No Buchstäbli card in main landmark. Observed 2026-04-16.

3. [ ] P1 - Demo word list contains entries that violate puzzle letter constraints
   - Agent: watson-qa-buchstaebli
   - Scenario: Word Entry / Validation Responses — code review of demo data
   - Problem: `DEMO_VALID_WORDS` in `buchstaebli.data.ts` includes three invalid entries for the puzzle (center A, outer R/E/T/N/S/L): `stern` (no center letter A), `anlage` (contains G, not in puzzle), `znacht` (Mundart example — contains Z, C, H, none in puzzle). These entries are unreachable through normal input (keyboard filter + hex buttons both restrict to puzzle letters) but the data is incorrect and will cause issues if validation ever moves server-side against this word list.
   - Suggested fix: Remove or replace these three entries with valid words. Replace `znacht` with a Mundart word using only the letters A/R/E/T/N/S/L (e.g. `ränzel` or similar). Remove `stern`/`anlage` or correct them.
   - Files: `src/games/buchstaebli/buchstaebli.data.ts`
   - Evidence: `stern`=S-T-E-R-N (no A), `anlage`=A-N-L-A-G-E (G absent), `znacht`=Z-N-A-C-H-T (Z,C,H absent). Cross-checked against SAMPLE_BUCHSTAEBLI.outer_letters=['R','E','T','N','S','L'], center='A'. Observed 2026-04-16.

4. [ ] P1 - RankBar `thresholds` prop declared but unused — rank milestones invisible
   - Agent: watson-qa-buchstaebli
   - Scenario: Scoring & Ranks — code review of RankBar component
   - Problem: `RankBar.tsx` declares `thresholds: BuchstaebliPuzzle['rank_thresholds']` in its `RankBarProps` interface but the function signature only destructures `{ currentRank, score, maxScore }`. The thresholds are never used. As a result the rank bar is a plain linear fill with no visual markers showing where Lehrling / Geselle / Meister / Bundesrat boundaries sit. Players can see their current rank label but cannot see how many points they need to advance — a key motivational feature of this genre.
   - Suggested fix: Destructure `thresholds` and render tick marks (or segmented fills) at each threshold percentage along the bar. At minimum, add a text hint like "noch X Pkt bis Lehrling".
   - Files: `src/games/buchstaebli/RankBar.tsx`
   - Evidence: `export function RankBar({ currentRank, score, maxScore }: RankBarProps)` — `thresholds` is in the type but not destructured. Bar renders as `width: ${pct}%` only. Observed 2026-04-16.

5. [ ] P2 - No success toast on regular valid word submission (silent success)
   - Agent: watson-qa-buchstaebli
   - Scenario: Validation Responses — valid standard word
   - Problem: `RESULT_MESSAGES['valid']` is set to `''` (empty string). When a player submits a correct non-pangram, non-mundart word, the `showToast` call is guarded by `if (RESULT_MESSAGES[lastResult])` which is falsy for an empty string, so no toast fires. The word appears in the found-words list below, but there is no immediate affirmative feedback at the point of submission. Compare to pangram (toast fires) and mundart (toast fires) — the baseline success case is the odd one out.
   - Suggested fix: Show a brief positive toast for valid words, e.g. `+${points} Pkt` or a short exclamation ("Gut!"). Alternatively, animate the input field green on success.
   - Files: `src/games/buchstaebli/BuchstaebliPage.tsx` (RESULT_MESSAGES constant)
   - Evidence: `RESULT_MESSAGES = { 'valid': '', ... }` + toast guard `if (RESULT_MESSAGES[lastResult])`. Observed 2026-04-16.

---

## Schlagziil QA Findings

_Items from watson-qa-schlagziil agent_

---

## Zämesetzli QA Findings

_Items from watson-qa-zaemesetzli agent_

---

## Code Review Escalations

_Critical findings from watson-code-reviewer_

---

## Architect Recommendations

_Weekly architecture review findings from watson-architect_

---

## Content Gaps

_Missing or invalid puzzle data from watson-puzzle-content_
