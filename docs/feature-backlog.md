# Feature Backlog

Items for the `watson-feature-worker` agent. Pick the first unchecked item, implement, commit to `feature/backlog`.

## Priority: High (Core Game Loop)

- [x] Supabase puzzle fetch: replace hardcoded `.data.ts` files with live Supabase queries for today's puzzle — done 2026-04-18
- [x] Daily puzzle reset: implement midnight CET rollover — show "new puzzle available" if cached puzzle is stale — done 2026-04-18
- [ ] Game completion state: persist completed state per puzzle per day in localStorage (prevent replaying same puzzle)
- [ ] Share card generation: implement `generateShareText()` per game with proper emoji grids and watson.ch URL
- [ ] Verbindige share: emoji grid format (colored squares for solve order)
- [ ] Schlagziil share: accuracy grid (green/red squares) + "Ich lese watson, und du?"
- [ ] Zämesetzli share: score + compounds found format

## Priority: Medium (User Engagement)

- [ ] User accounts: Supabase Auth with email magic link — basic sign-up/sign-in flow
- [ ] Streak tracking: calculate and display current streak per game (consecutive days played)
- [ ] Streak prompt: show "Willst du deinen Streak behalten? Konto erstellen." after Day 3
- [ ] Profile page: `/profil` route showing streaks, stats, games played per game
- [ ] Archive mode: `/archiv` route with calendar view of past puzzles (no streak credit)
- [ ] Leaderboard: basic daily leaderboard per game (score-based for Zämesetzli, speed for Verbindige/Schlagziil)

## Priority: Lower (Monetization & Integration)

- [ ] Sponsor bar: "Presented by [Brand]" banner above game area (728x90 leaderboard slot)
- [ ] Post-game ad slot: MREC 300x250 ad unit in results screen
- [ ] Pre-game interstitial: 5-second ad shown once per session on mobile
- [ ] Analytics events: implement core tracking (game_started, game_completed, game_shared, streak_milestone)
- [ ] Analytics: game-specific events (verbindige_guess, schlagziil_headline_solved)
- [ ] Push notification opt-in: daily reminder prompt with configurable time
- [ ] Instagram story share: generate 1080x1920 canvas image with watson branding + result grid

## Priority: Future (Post-Launch)

- [ ] Sunday Schlagziil "Rückblick": 10 headlines, harder difficulty, separate leaderboard
- [ ] Branded Verbindige editions: CMS tool for creating sponsor-themed puzzles
- [ ] PWA: add service worker for offline play after initial puzzle load
- [ ] Performance: code-split per game (lazy-load game bundles)
