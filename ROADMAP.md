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

1. [x] P1 - Shake animation never fires on wrong guess
   - Agent: watson-qa-verbindige
   - Scenario: Full Game Flow — made 3 wrong guesses
   - Problem: `VerbindigeBoard.tsx:21` builds `wrongItems` from `selected` read from Zustand store, but `submitGuess()` already sets `selected: []` before the effect runs. `setWrongItems(new Set([]))` always gets an empty set — tiles never turn pink or shake.
   - Suggested fix: Capture selected items inside `submitGuess()` before clearing them, store as a separate `lastWrongItems` state field. Read that in the board effect instead of `selected`.
   - Files: `src/games/verbindige/useVerbindige.ts`, `src/games/verbindige/VerbindigeBoard.tsx`
   - Evidence: `submitGuess()` sets `selected: []` on line 80 unconditionally. Board `useEffect` on line 21 reads `selected` from same store — always empty. No tile animation observed across all 3 wrong guesses. Observed 2026-04-16.

2. [x] P1 - "One away" toast never appears despite 3 qualifying wrong guesses
   - Agent: watson-qa-verbindige
   - Scenario: Full Game Flow — all 3 wrong guesses were one-away (3/4 correct)
   - Problem: All 3 wrong guesses contained 3 correct items from one group (confirmed via `verbindige.data.ts`). `useVerbindige.ts:98-101` correctly sets `lastGuessResult: 'one-away'`. `VerbindigePage.tsx:28-30` calls `showToast('Fast! Nur 1 falsch.')`. No toast appeared in any screenshot — likely a React effect race where the board clears `lastGuessResult` before the page effect reads it.
   - Suggested fix: Move toast logic into the store action (call `showToast` inside `submitGuess`) to avoid effect race. Alternatively add a small delay before `clearLastResult()` when result is 'one-away'.
   - Files: `src/games/verbindige/VerbindigeBoard.tsx`, `src/games/verbindige/VerbindigePage.tsx`, `src/games/verbindige/useVerbindige.ts`
   - Evidence: Guess 1 Tschumpel/Tubel/Güxi/Löli → 3/4 Dummkopf. Guess 2 Töffli/Velo/Trottinett/Tscholi → 3/4 Fortbewegung. Guess 3 same+Sürmel → 3/4 Fortbewegung. No toast visible in any post-guess screenshot. Observed 2026-04-16.

3. [x] P2 - Puzzle identifier inconsistent: header shows #001, result shows #2026-04-16
   - Agent: watson-qa-verbindige
   - Scenario: Full Game Flow — result screen after winning
   - Problem: Game header displays "Verbindige #001" (hardcoded `puzzleNumber={1}` in `VerbindigePage.tsx:46`). Result footer displays "Verbindige #2026-04-16" (using `puzzle.date` in `VerbindigeResult.tsx:38`). A user comparing their shared result to the header would see two different identifiers.
   - Suggested fix: Standardise on one identifier. Derive a puzzle number from the date or use the date consistently everywhere. Update `GameHeader` to accept a `puzzleId: string` prop.
   - Files: `src/games/verbindige/VerbindigePage.tsx`, `src/games/verbindige/VerbindigeResult.tsx`, `src/components/shared/GameHeader.tsx`
   - Evidence: Header rendered "Verbindige #001"; result panel rendered "Verbindige #2026-04-16". Observed 2026-04-16.

4. [ ] P2 - No first-time onboarding or how-to-play
   - Agent: watson-qa-verbindige
   - Scenario: Full Game Flow — first load with no prior knowledge
   - Problem: The only instruction visible is subtitle "Finde 4 Gruppen à 4". No how-to-play modal, tooltip, or example. A new player cannot tell that 4 tiles must be selected before submitting, that wrong guesses have a limit of 4, or that tiles deselect on second tap.
   - Suggested fix: Add a dismissible "?" info modal explaining rules in 3 bullet points. Gate it with `localStorage` to only show on first visit.
   - Files: `src/games/verbindige/VerbindigePage.tsx`
   - Evidence: No `<dialog>`, modal, or tooltip found in DOM. Only on-screen instruction is the subtitle. Observed 2026-04-16.
   - Related: Zämesetzli #5 — same onboarding gap pattern; consider a shared HowToPlay component

5. [x] P1 - Share text uses hardcoded puzzle number "#1" — third distinct puzzle identifier
   - Agent: watson-qa-verbindige
   - Scenario: Share Flow — completing a game and clicking Teilen
   - Problem: `VerbindigeResult.tsx:23` calls `generateShareText('verbindige', 1, emojiGrid)` with a hardcoded literal `1`. The resulting share text reads "Verbindige #1 🇨🇭". This is a third distinct identifier for the same puzzle: the game header shows "Verbindige #001", the result footer shows "Verbindige #2026-04-16", and the share text shows "Verbindige #1". A recipient who taps a shared result and sees "#1" cannot match it to the header "#001" they see in the app.
   - Suggested fix: Pass `puzzle.id` or a date-derived number consistently. Since finding #3 recommends standardising on one identifier across header and result footer, extend that fix to also update `VerbindigeResult.tsx:23` so all three surfaces use the same value.
   - Files: `src/games/verbindige/VerbindigeResult.tsx` (line 23), `src/lib/share.ts`
   - Evidence: Captured share text via clipboard interceptor: "Verbindige #1 🇨🇭\n🟨🟨🟨🟨\n🟩🟩🟩🟩\n🟦🟦🟦🟦\n🟪🟪🟪🟪\nwatson.ch/spiele/verbindige". Header on same page rendered "Verbindige #001". Result footer rendered "Verbindige #2026-04-16". Observed 2026-04-18.

6. [ ] P2 - Share error propagates uncaught — silent failure when clipboard is denied
   - Agent: watson-qa-verbindige
   - Scenario: Share Flow — Teilen click when clipboard permission denied or document unfocused
   - Problem: `share.ts:32` calls `navigator.clipboard.writeText(text)` with no try/catch. If it throws (e.g. `NotAllowedError: Document is not focused`, or clipboard permission denied), the rejection propagates to `ShareButton.handleShare()` which also has no catch. `setCopied(true)` (line 14) is never reached — the button label stays "Teilen" forever and no error toast appears. The user has zero indication that the share failed. Note: under normal usage the clipboard succeeds, but on permission-denied or after a cancelled `navigator.share` dialog, this path is reachable.
   - Suggested fix: Wrap the `clipboard.writeText` call in try/catch in `share.ts`. On catch, either rethrow a typed error or return `false`. In `ShareButton.handleShare`, catch the error and show a fallback toast ("Teilen fehlgeschlagen").
   - Files: `src/lib/share.ts` (line 32), `src/components/shared/ShareButton.tsx` (line 12-15)
   - Evidence: Console log showed `NotAllowedError: Failed to execute 'writeText' on 'Clipboard': Document is not focused` thrown from `share.ts`. Post-click page read confirmed button label remained "Teilen" (not "Kopiert!"). Observed 2026-04-18.

---

## Schlagziil QA Findings

_Items from watson-qa-schlagziil agent_

1. [x] P1 - Revealed answers show normalized non-German strings
   - Agent: watson-qa-schlagziil
   - Scenario: Error Counting — game-over after 3 total errors on headline 1
   - Problem: When an answer is revealed (game-over), `revealedAnswers[i]` is set to `DEMO_ANSWERS[i][0]` which is the lowercase normalized form. `HeadlineCard` only uppercases the first character. Result: "Missstaende" instead of "Missstände", "Ubs" instead of "UBS", "Co2-gesetz" instead of "CO2-Gesetz".
   - Suggested fix: Add a `display_answer` field alongside `DEMO_ANSWERS` for each headline holding the canonical display-ready string. Use that in `revealedAnswers` instead of the normalized key.
   - Files: `src/games/schlagziil/schlagziil.data.ts`, `src/games/schlagziil/useSchlagziil.ts`
   - Evidence: Results screen showed "Missstaende", "Ubs", "Co2-gesetz" live in production. Observed 2026-04-16.
   - Related: #2 — both affect the wrong-guess / game-over flow in Schlagziil; consider fixing together

2. [ ] P1 - No visual feedback for wrong guesses below error limit
   - Agent: watson-qa-schlagziil
   - Scenario: Answer Validation — submitting wrong answers with totalErrors < 3
   - Problem: After a wrong guess, `results[currentIndex]` stays `null` so the HeadlineCard border stays neutral. `lastGuessResult: 'wrong'` is set in the store but `SchlagziilPage` only reads `lastGuessResult` for the correct-answer auto-advance timer — it never triggers a red flash, shake, or toast. The user sees the input clear with no feedback beyond the error dot filling.
   - Suggested fix: In `SchlagziilPage`, add a `useEffect` on `lastGuessResult === 'wrong'` to show a toast ("Falsch!") or pass a `wrongFlash` prop to `HeadlineCard` for a brief red-border animation.
   - Files: `src/games/schlagziil/SchlagziilPage.tsx`, `src/games/schlagziil/HeadlineCard.tsx`
   - Evidence: Submitted two wrong guesses — input cleared each time with no card colour change, no toast, only error dots updated. Confirmed via Zustand state: `totalErrors: 2, results: [null,null,null,null,null], lastGuessResult: 'wrong'`. Observed 2026-04-16.
   - Related: #1 — both affect the wrong-guess / game-over flow in Schlagziil; consider fixing together

3. [ ] P2 - Share CTA text differs from brand spec ("Kennst du watson?" vs "Ich lese watson, und du?")
   - Agent: watson-qa-schlagziil
   - Scenario: Results Screen — share button
   - Problem: `SchlagziilResult.tsx` passes `"Kennst du watson?"` as the CTA line in the share text. The expected brand CTA is "Ich lese watson, und du?".
   - Suggested fix: Change the resultLines string from `"Kennst du watson?"` to `"Ich lese watson, und du?"`.
   - Files: `src/games/schlagziil/SchlagziilResult.tsx`
   - Evidence: Page text at game-over contained "Kennst du watson?". Observed 2026-04-16.
   - Priority adjusted from P1 to P2: minor wording tweak, not a UX or gameplay issue
   - Related: #4 — both are share-related issues on the Schlagziil result screen; consider fixing together

4. [ ] P1 - Share link appends non-existent watson.ch URL
   - Agent: watson-qa-schlagziil
   - Scenario: Results Screen — share button
   - Problem: `generateShareText` appends `watson.ch/spiele/schlagziil` to every share text. That URL does not exist — the game lives at `games-watson.netlify.app/schlagziil`. Anyone who taps the link in a shared message hits a 404.
   - Suggested fix: Update `share.ts` to use the real base URL (env variable `VITE_SITE_URL` or hardcoded production domain).
   - Files: `src/lib/share.ts`
   - Evidence: Share text footer reads `watson.ch/spiele/schlagziil`. Same bug affects all games sharing via this util. Observed 2026-04-16.
   - Related: #3 — both are share-related issues on the Schlagziil result screen; consider fixing together

5. [ ] P2 - All article URLs are placeholder paths — "watson-Artikel lesen" links 404
   - Agent: watson-qa-schlagziil
   - Scenario: Article Links — results screen after game-over
   - Problem: All 5 headlines in `SAMPLE_SCHLAGZIIL` have stub `article_url` values (`/energie/123`, `/migration/456`, etc.). Clicking "watson-Artikel lesen →" leads to a 404, breaking the core value prop of reading the real article after guessing.
   - Suggested fix: Replace stub URLs with real watson.ch article URLs for each headline before launch.
   - Files: `src/games/schlagziil/schlagziil.data.ts`
   - Evidence: Interactive tree confirmed all 5 links use numeric stub paths (`/123`, `/456`, `/789`, `/101`, `/102`). Observed 2026-04-16.
   - Related: Schlagziil #4 — share URL also wrong; both need the correct production base URL

6. [x] P1 - Hint state leaks between headlines — subsequent tips auto-reveal without user click
   - Agent: watson-qa-schlagziil
   - Scenario: Answer Validation — clicked "Tipp anzeigen" on headline 1, then advanced through all 5 headlines
   - Problem: `HeadlineCard.tsx:33` uses `const [showHint, setShowHint] = useState(false)` for hint visibility. React reuses the same component instance when `currentIndex` advances (same JSX position, only props change), so `showHint` stays `true` from the previous headline. After clicking the hint once on headline 1, the hint text for headlines 2–5 is displayed automatically without any user action.
   - Suggested fix: Add `key={currentIndex}` to the `HeadlineCard` in `SchlagziilPage.tsx` (line 76) so React force-remounts the component on each headline advance, resetting all local state. Alternatively add `useEffect(() => { setShowHint(false); }, [display])` inside `HeadlineCard.tsx`.
   - Files: `src/games/schlagziil/HeadlineCard.tsx`, `src/games/schlagziil/SchlagziilPage.tsx`
   - Evidence: Clicked "Tipp anzeigen" on headline 1 (2026/Solarenergie). Screenshots of headlines 2 (2025), 3 (2023), 4 (2021), 5 (2024) all showed hint text immediately without any click. `hintsUsed` Zustand state tracked only the intentional click correctly (💡 shown only for 2026 in final score), confirming the bug is isolated to local component state. Observed 2026-04-18.

7. [ ] P2 - `autoFocus` on HeadlineCard input triggers mobile keyboard before player reads headline
   - Agent: watson-qa-schlagziil
   - Scenario: Mobile Input — page load on 390px viewport
   - Problem: `HeadlineCard.tsx:122` has `autoFocus` on the text input. On mobile devices this causes the virtual keyboard to pop up immediately on page load, covering the lower portion of the screen before the player has read the full headline. The user must dismiss the keyboard manually just to see what they need to guess. On headline advance the same auto-focus fires again, re-triggering the keyboard. This is a known mobile UX anti-pattern for quiz/reading games.
   - Suggested fix: Remove `autoFocus` from the input. On desktop it can be re-added via a `useEffect` with `inputRef.focus()` guarded by `window.innerWidth > 768` or a media-query check.
   - Files: `src/games/schlagziil/HeadlineCard.tsx` (line 122)
   - Evidence: `autoFocus` attribute confirmed in source. Standard browser behaviour on iOS/Android: `autoFocus` on an `<input>` opens the soft keyboard on mount. Observed 2026-04-18.

8. [ ] P2 - Year line in results/share uses puzzle order, not chronological order
   - Agent: watson-qa-schlagziil
   - Scenario: Results Screen — completing all 5 headlines
   - Problem: `SchlagziilResult.tsx:13-19` builds the year line by mapping `puzzle.headlines` in stored order. SAMPLE_SCHLAGZIIL stores headlines as 2026, 2025, 2023, 2021, 2024. The results panel and share text show "2026 ✓ | 2025 ✓ | 2023 ✓ | 2021 ✓ | 2024 ✓" — 2021 appears after 2023, breaking any readable timeline. A recipient reading a shared result cannot scan it as a chronology.
   - Suggested fix: Sort entries by `article_year` before joining: map headlines+results to objects, sort ascending by year, then join. This decouples puzzle storage order from the user-facing output.
   - Files: `src/games/schlagziil/SchlagziilResult.tsx` (lines 13-19)
   - Evidence: Live results screen showed "2026 ✓ | 2025 ✓ | 2023 ✓ | 2021 ✓ | 2024 ✓" — out-of-order years confirmed by screenshot. Observed 2026-04-18.

---

## Zämesetzli QA Findings

_Items from watson-qa-zaemesetzli agent_

1. [ ] P1 - Silent failure on invalid combination — no error feedback
   - Agent: watson-qa-zaemesetzli
   - Scenario: Invalid Combinations — submitting a nonsense word for selected emojis
   - Problem: When a user submits a word that does not match any valid compound for the selected emoji pair, the input field clears silently. No toast, no shake/error animation, no error text — the user has zero signal that their guess was rejected.
   - Suggested fix: Show a brief error toast (e.g. "Nicht gefunden 🚫") or apply a shake animation + red border on the input on invalid submission.
   - Files: `src/games/zaemesetzli/ZaemesetzliPage.tsx` (submit handler), `src/components/shared/Toast.tsx`
   - Evidence: Submitted "Haussonnen" for 🏠+☀️ pair. Input cleared, score unchanged (2/28), found list unchanged (2/16), no console errors, no visual change. Observed 2026-04-16.
   - Related: #4 — both are submission feedback issues in Zämesetzli (error + success); consider fixing together

2. [ ] P1 - "Teilen" button provides no user feedback
   - Agent: watson-qa-zaemesetzli
   - Scenario: Combination Flow — clicking share mid-game
   - Problem: Clicking "Teilen" while the game is in progress produces no visible result — no toast saying "Kopiert!", no share sheet, no animation. It is unclear if anything was copied to clipboard or if the action failed silently.
   - Suggested fix: Show a "Kopiert! 📋" toast on clipboard copy success, and a fallback error toast if navigator.share / clipboard API fails. The Verbindige ShareButton already does this pattern — reuse it.
   - Files: `src/games/zaemesetzli/ZaemesetzliPage.tsx`, `src/components/shared/ShareButton.tsx`
   - Evidence: Clicked "Teilen" at 2/16 found, 1/28 Pkt. Page state unchanged, no console output, no toast or modal. Observed 2026-04-16.

3. [ ] P1 - Hint deducts a point but does not auto-select the hinted emojis
   - Agent: watson-qa-zaemesetzli
   - Scenario: Combination Flow — using the Tipp button with a different emoji pair active
   - Problem: Clicking "💡 Tipp (-1 Pkt)" shows a tooltip like "Tipp: 🏠 + 🔑 = ?" and deducts 1 point, but the currently selected emoji pair in the combine slots is unchanged (was 🏠+☀️, stayed 🏠+☀️). The user paid a point for a hint but must manually deselect and reselect to use it.
   - Suggested fix: When a hint is triggered, auto-update the combine slots to show the hinted emoji pair: clear current selection, then programmatically select the two hinted emojis. Optionally add a pulse highlight on those emoji tiles.
   - Files: `src/games/zaemesetzli/ZaemesetzliPage.tsx` (hint handler logic)
   - Evidence: Had 🏠+☀️ in slots. Clicked Tipp. Tooltip showed "🏠 + 🔑 = ?", score dropped 2→1, but slots still showed 🏠+☀️. Observed 2026-04-16.

4. [ ] P2 - No success animation or celebration on correct compound
   - Agent: watson-qa-zaemesetzli
   - Scenario: Combination Flow — submitting a valid compound word
   - Problem: After a correct answer (e.g. "Haustür"), the input clears and the word appears in the "Gefunden" list, but there is no immediate visual celebration: no toast, no color flash, no emoji animation. The feedback is purely textual and easy to miss.
   - Suggested fix: Show a brief success toast (e.g. "✅ Haustür gefunden! +1 Pkt") that auto-dismisses after 1.5s, and/or a pulse animation on the newly added found-list row.
   - Files: `src/games/zaemesetzli/ZaemesetzliPage.tsx`, `src/components/shared/Toast.tsx`
   - Evidence: Submitted "Haustür" → found list row appeared, score ticked to 1/28 Pkt. No toast or animation observed in screenshot taken immediately after submit. Observed 2026-04-16.
   - Related: #1 — both are submission feedback issues in Zämesetzli (error + success); consider fixing together

5. [ ] P2 - No onboarding explaining the two-step mechanic
   - Agent: watson-qa-zaemesetzli
   - Scenario: First Play — arriving at the game with no prior knowledge
   - Problem: The only instruction is subtitle "Kombiniere Emojis zu deutschen Wörtern". The game has a two-step mechanic: (1) tap emojis to fill combine slots, then (2) type the German compound word. Step 2 is non-obvious — new players may expect clicking emojis to auto-reveal the answer. The placeholder "Wähle 2-3 Emojis..." does not hint that typing is required.
   - Suggested fix: Add a dismissible "Wie geht's?" info modal on first visit (localStorage-gated) with 3 steps: tap emojis → type the word → submit. Alternatively, add a persistent one-liner below the combine area: "Emojis wählen, Wort eintippen, abschicken!"
   - Files: `src/games/zaemesetzli/ZaemesetzliPage.tsx`
   - Evidence: Page loads with only subtitle as instruction. First click on emoji selected it in slot but revealed no next-step guidance. Placeholder changes to "Zusammengesetztes Wort..." only after 2 emojis are selected — too late. Observed 2026-04-16.
   - Related: Verbindige #4 — same onboarding gap pattern; consider a shared HowToPlay component

6. [ ] P2 - No rank-up notification when crossing a rank threshold
   - Agent: watson-qa-zaemesetzli
   - Scenario: Scoring & Ranks — played through Stift→Lehrling (6pt) and Lehrling→Geselle (13pt) rank transitions
   - Problem: When score crosses a rank threshold the rank label and progress hint silently update, but there is no toast, no confetti, no flash animation. Two transitions confirmed (Stift→Lehrling at 6pt, Lehrling→Geselle at 12pt+) — both entirely silent. Code confirms: the only `useEffect` in `ZaemesetzliPage.tsx` watches `lastResult`; there is no effect watching `currentRank` changes.
   - Suggested fix: Add a `useEffect` on `currentRank` (comparing prev value to current) to fire a celebratory toast, e.g. "🎉 Geselle erreicht!" when the rank advances. A brief rank-name pulse animation on the label would also reinforce the milestone.
   - Files: `src/games/zaemesetzli/ZaemesetzliPage.tsx` (add rank-change effect), `src/components/shared/Toast.tsx`
   - Evidence: Screenshot taken immediately after reaching 6pt shows "Lehrling" label and updated hint, no toast in DOM. Same for Geselle transition at 13pt. `ZaemesetzliPage.tsx:45-51` only tracks `lastResult`. Observed 2026-04-18.

7. [ ] P1 - d=2/d=3 compounds use emojis as phonetic stand-ins not listed in alt_nouns
   - Agent: watson-qa-zaemesetzli
   - Scenario: Scoring & Ranks — attempted all 16 compounds; 5 require non-obvious emoji readings
   - Problem: Five compounds require interpreting emojis in ways that appear nowhere in `alt_nouns` or any UI element: `🔑` (Schlüssel) as "-schein" in Sonnenschein; `🔑` as "-schloss" in Türschloss; `🔔` (Glocke) as "-uhr" in Sonnenuhr; `🔔` as "-bund" in Schlüsselbund; `☀️` (Sonne) as "Sonntag-" in Bergsonntag. A player who logically tries "Sonnenschlüssel" (sun + key → literal) gets rejected with no guidance. The hint button reveals the emoji pair (e.g. "☀️+🔑=?") but still leaves the player stuck on what word to type. The only discovery path is random guessing.
   - Suggested fix: Extend `alt_nouns` for each affected emoji to include the hidden readings: `🔑`: add `"Schein"`, `"Schloss"`; `🔔`: add `"Uhr"`, `"Bund"`; `☀️`: add `"Sonntag"`. Then surface these in a tooltip or the hint message when the relevant emoji pair is selected (e.g. hint changes to "Tipp: 🔑 kann auch 'Schein' bedeuten").
   - Files: `src/games/zaemesetzli/zaemesetzli.data.ts` (alt_nouns), `src/games/zaemesetzli/ZaemesetzliPage.tsx` (hint display)
   - Evidence: `zaemesetzli.data.ts` line 8: `🔑 alt_nouns: ['Key']`; line 13: `🔔 alt_nouns: []`; line 15: `☀️ alt_nouns: ['Licht']`. All five abstract compounds accepted in-game (confirmed). Observed 2026-04-18.

8. [ ] P1 - "Bergsonntag" requires two-hop etymology (☀️→Sonne→Sonntag) and is incorrectly marked non-Mundart
   - Agent: watson-qa-zaemesetzli
   - Scenario: Scoring & Ranks — reviewing d=3 compound data
   - Problem: `Bergsonntag` [⛰️+☀️] is the hardest compound (difficulty: 3, points: 3). ☀️'s canonical noun is "Sonne" but the compound needs "Sonntag" (Sunday). The leap from ☀️→Sonntag requires knowing German etymology (Sonntag = "Sonne" + "-tag" = "day of the sun") — two conceptual hops away from the emoji. The word "Bergsonntag" itself denotes a traditional Swiss Alpine Sunday celebration, making it regionally specific but it is marked `is_mundart: false`, so it receives no Mundart-Bonus toast and no 🇨🇭 marker in the found list. Players who find it get no signal it's culturally Swiss.
   - Suggested fix: Either mark `is_mundart: true` (triggering the "Mundart-Bonus! 🇨🇭" toast) or add a cultural-note tooltip. Also add `"Sonntag"` to ☀️'s `alt_nouns` (see finding #7).
   - Files: `src/games/zaemesetzli/zaemesetzli.data.ts` (line 33: `is_mundart: false`)
   - Evidence: `{ word: 'Bergsonntag', components: ['⛰️','☀️'], difficulty: 3, points: 3, is_mundart: false }` in data file. ☀️ alt_nouns only contains `'Licht'`, not `'Sonntag'`. Observed 2026-04-18.

9. [x] P1 - max_score: 28 is incorrect — actual compound point sum is 29
   - Agent: watson-qa-zaemesetzli
   - Scenario: Scoring & Ranks — summing all compound points
   - Problem: `zaemesetzli.data.ts` sets `max_score: 28`, but summing all 16 compound `points` values gives 29 (7×1pt + 5×2pt + 4×3pt = 7+10+12 = 29). `RankBar.tsx:21` uses `maxScore` to compute the bar fill percentage and at Bundesrat (nextRank=null) renders `${score}/${maxScore} Pkt`. A player who finds all 16 compounds scores 29pt and sees "29/28 Pkt" — an impossible-looking score. The progress bar caps correctly at 100% due to `Math.min(100, …)`, but the label is misleading.
   - Suggested fix: Fix `max_score` to `29` in `zaemesetzli.data.ts`. Alternatively derive it dynamically: `valid_compounds.reduce((sum, c) => sum + c.points, 0)`.
   - Files: `src/games/zaemesetzli/zaemesetzli.data.ts` (line 36: `max_score: 28`)
   - Evidence: Compound points: 1+1+1+1+2+1+2+1+2+2+3+2+1+3+3+3 = 29. Data shows `max_score: 28`. `RankBar.tsx:40-41` renders `${score}/${maxScore} Pkt` when Bundesrat is reached. Observed 2026-04-18.

10. [ ] P2 - Current numeric score hidden during play; only relative "noch X Pkt" shown
    - Agent: watson-qa-zaemesetzli
    - Scenario: Scoring & Ranks — tracking progress during active play
    - Problem: While playing, the RankBar right-side text always reads "noch X Pkt bis Y" (e.g. "noch 7 Pkt bis Meister"), never showing the actual score (e.g. "13 Pkt"). The raw score only becomes visible once Bundesrat is reached (when `nextRank` is null). Players cannot easily tell where they are on the full scale without mentally summing individual compound scores from the found list.
    - Suggested fix: In `RankBar.tsx:38-40`, change the right-side label to show both: `${score} Pkt (noch ${pointsToNext} bis ${RANK_LABELS[nextRank]})` or add a small score label above/below the bar.
    - Files: `src/components/shared/RankBar.tsx` (lines 38-41)
    - Evidence: At 13pt (Geselle) the bar showed "noch 7 Pkt bis Meister" — no raw score. `RankBar.tsx:39-41` confirms raw score is only rendered when `nextRank` is falsy. Observed 2026-04-18.

11. [x] P0 - Netlify deploy failing — CLI not authenticated and MCP deploy tool unavailable
    - Agent: watson-roadmap-worker
    - Scenario: Automated deploy after fixing Verbindige #5
    - Problem: `netlify deploy --prod` returns "Unauthorized: could not retrieve project". `netlify status` shows "Not logged in". The MCP tool `mcp__a95af696-7dd0-4a65-b9d5-96537d1bf632__netlify-deploy-services-updater` is not available in the current tool set. No deploy path exists.
    - Suggested fix: Run `netlify login` interactively to authenticate the CLI, or ensure the Netlify MCP tool is configured in the Claude Code MCP settings.
    - Files: CLI auth / MCP config
    - Evidence: `netlify deploy --prod --dir=dist --site=cfaa1817-72f7-47cd-8a95-8c998529bcf9` → "Error: Unauthorized: could not retrieve project". `netlify status` → "Not logged in." Observed 2026-04-18.
    - Resolution: Netlify MCP tools (`mcp__claude_ai_Netlify__netlify-deploy-services-updater/reader`) now available in Claude Code MCP config. Resolved 2026-04-19.

---

## Code Review Escalations

_Critical findings from watson-code-reviewer_

---

## Architect Recommendations

_Weekly architecture review findings from watson-architect_

1. [ ] P2 - Extract `shuffleArray` utility function
   - Agent: watson-architect
   - Scenario: Cross-game code duplication audit (2026-04-16)
   - Problem: `shuffleArray<T>` is copy-pasted in `useVerbindige.ts:26` and `useZaemesetzli.ts`. Semantically identical.
   - Suggested fix: Extract to `src/lib/utils.ts`.
   - Files: `src/lib/utils.ts` (create), `src/games/verbindige/useVerbindige.ts`, `src/games/zaemesetzli/useZaemesetzli.ts`
   - Priority: P2 — pure code deduplication with no user-facing impact

2. [ ] P1 - Add keyboard navigation to Verbindige and Zaemesetzli
   - Agent: watson-architect
   - Scenario: Accessibility audit (2026-04-16)
   - Problem: Verbindige and Zaemesetzli have no keyboard interaction — keyboard-only users cannot play.
   - Suggested fix: Add `window.addEventListener('keydown', ...)` in VerbindigePage and ZaemesetzliPage. Verbindige: Enter=submitGuess, Backspace=clearSelection. Zaemesetzli: Enter=submitWord, Backspace=clearEmojiSelection.
   - Files: `src/games/verbindige/VerbindigePage.tsx`, `src/games/zaemesetzli/ZaemesetzliPage.tsx`
   - Related: #3 (ARIA labels) — both are accessibility issues affecting the same files; consider fixing in one pass

3. [ ] P1 - Add ARIA labels to interactive game elements
   - Agent: watson-architect
   - Scenario: Accessibility audit (2026-04-16)
   - Problem: Only 1 `aria-label` found across game directories (`EmojiPool.tsx:30`). Tile buttons, combine slots, and action buttons across games lack ARIA labels — screen reader inaccessible.
   - Suggested fix: Add `aria-label` to all interactive button-like elements. Minimum viable: VerbindigeTile, CombineSlots, game action buttons.
   - Files: `src/games/verbindige/VerbindigeTile.tsx`, `src/games/zaemesetzli/CombineSlots.tsx`
   - Related: #2 (keyboard navigation) — both are accessibility issues affecting the same files; consider fixing in one pass

---

## Content Gaps

_Missing or invalid puzzle data from watson-puzzle-content_
