# Release Log

## Release — 2026-04-29 16:30

- Commits: 6b0706a..389e739 (24 commits)
- Netlify deploy: skipped (API returned 404 for "latest" deployId)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: healthy (all 200/201, zero errors in last 24h)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagziil ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl), quizzhuber ✓ (curl), aufgedeckt ✓ (curl), quizzticle ✓ (curl)
- Skipped checks: Netlify deploy (API 404), Chrome smoke test / JS render / console errors (Chrome MCP not available)

### Notable commits
- 389e739 review: code review findings for cms branch
- 7b3ec76 polish: lost-game share shows gray ⬛ for auto-revealed Verbindige groups
- d0f5410 review: weekly architecture review
- 086876e fix(lint): clean up React-Compiler-flagged setState-in-effect patterns
- 5ffe853 feat(quizzhuber): rename display label to "Quizz den Huber"; expand puzzle agent to all six games
- 5125fd1 fix(profil): list all six games (Quizzhuber, Aufgedeckt, Quizzticle were missing)
- 870cc4f fix(theme): force light mode until proper dark-mode pass
- 02f6d91 fix(verbindige): show result screen on reload after win/loss
- df4c5b5 feat(cms): editor CMS for all six games (schedule, per-format forms, edge function)
- 60f876f fix(aufgedeckt): replace stale Wikimedia thumbnail URLs
- 7a8fd69 feat(games): three new recurring formats — Quizzhuber, Aufgedeckt, Quizzticle
- 95539b1 design: tighten visual fidelity to watson.ch chrome
- 39022a9 fix(schlagloch): derive answers + display answers from headline rows
- a18a44f feat(gamification): phase 4 — web push subscriptions (account-agnostic)
- 2045bc7 feat(gamification): phase 3 — period leaderboards (Heute / Woche / Monat / Allzeit)
- 0e762bc perf: stub unused Supabase modules — vendor-supabase 48.53KB → 27.09KB gzip
- 747c318 feat(gamification): phase 2 — achievements (11 launch badges)
- 99f5744 copy(streaks): rename Eis-Tag → Joker (less Duolingo, more quiz-show)

### Notes
24 commits over 1 day. Major additions: three new game formats (Quizzhuber, Aufgedeckt, Quizzticle), editor CMS for all six games, gamification phases 2–4 (achievements, period leaderboards, web push). Supabase API is healthy with active real-user traffic across multiple game types and devices (desktop + mobile Safari/Chrome). Without Chrome MCP, JS rendering and console errors could not be verified.

---

## Last Verified
- Commit: 389e739
- Date: 2026-04-29

---

## Release — 2026-04-28 14:00

- Commits: 84370e2..6b0706a (103 commits)
- Netlify deploy: skipped (MCP not available)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: skipped (MCP not available)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagziil ✓ (curl), schlagloch ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl, game removed — SPA shell returns 200)
- Skipped checks: Netlify deploy (MCP not available), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP not available)

### Notable commits
- 6b0706a feat(gamification): phase 1.3 — account prompt at the day-3 threshold
- 36cd433 feat(gamification): phase 1.1+1.2 — at-risk streak indicator + Eis-Tag freeze
- 6d10f80 feat(gamification): phase 0 plumbing — leaderboard, events, streaks server sync
- 608dcc3 feat(zaemesetzli): tap-to-toggle emoji selection and slot removal
- f744242 feat: code-split per game with lazy-load and dependency isolation
- 501479e rename: Schlagziil -> Schlagloch
- 964c565 feat: add PWA service worker for offline play
- 4485938 feat: branded Verbindige editions CMS for sponsor-themed puzzles
- 9a5023d fix(sw): bump cache version to v3 so users pick up supabase fetch fix
- 3239591 fix(supabase): join game tables on id, not puzzle_id

### Notes
Large release spanning 8 days (2026-04-20 to 2026-04-28) with 103 commits. Major additions include gamification phase 0–1.3 (leaderboard, streaks, Eis-Tag freeze, account prompts), PWA service worker, code splitting, and the Schlagziil→Schlagloch rename. Without Chrome MCP, JS rendering and console errors could not be verified.

---

## Last Verified
- Commit: 6b0706a
- Date: 2026-04-28

---

## Release — 2026-04-20 23:45

- Commits: 49f6fe5..84370e2 (4 commits)
- Netlify deploy: skipped (MCP not granted)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: skipped (MCP not granted)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagloch ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl, game removed — SPA shell returns 200)
- Skipped checks: Netlify deploy (MCP not granted), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP not granted)

### Notable commits
- 84370e2 feat: add daily sweep celebration + combined share card on landing page
- 141ecb7 feat: add analytics event tracking for all games
- 50d5059 polish: improve ShareButton feedback for Web Share API vs clipboard
- 0690a67 triage: deduplicate and clean up roadmap findings

---

## Last Verified
- Commit: 84370e2
- Date: 2026-04-20

---

## Release — 2026-04-20 21:00

- Commits: 17c2af7..49f6fe5 (39 commits)
- Netlify deploy: skipped (MCP not available)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: skipped (MCP not available)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagloch ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl, game removed — SPA shell returns 200)
- Skipped checks: Netlify deploy (MCP not available), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP not available)

### Notable commits
- 49f6fe5 feat: add duplicate guess prevention and toast feedback to Verbindige
- 77b21d5 fix: add ARIA labels to interactive game elements across all games
- 72ed260 fix: add keyboard navigation to Verbindige and Zämesetzli
- a00c0ee feat: add sponsor bar above game area and create missing StreakBadge component
- 60a06ac polish: add custom 404 page with link back to landing
- 36403f6 feat: transform landing page into personalized daily dashboard
- 457785e feat: daily leaderboard per game with score submission and top-10 display
- 691fd16 feat: add Buchstäbli game completion flow with results screen, streak tracking, and archive support
- adac8e5 feat: archive mode with calendar view of past puzzles
- d72136e feat: profile page with streak stats per game

---

## Release — 2026-04-20 15:30

- Commits: 70cfbcf..17c2af7 (10 commits)
- Netlify deploy: skipped (MCP not available)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: skipped (MCP not available)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagloch ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl, game removed — SPA shell returns 200)
- Skipped checks: Netlify deploy (MCP not available), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP not available)

### Notable commits
- 87dbe18 feat: wrong-answer shake feedback for Schlagloch headline cards
- 41077ee polish: AdSlot placeholder with dashed border and "Anzeige" label
- 17c2af7 docs: mark skeleton loader polish item complete
- 8299d89 docs: sync changelog and update documentation
- be79180 review: incremental code review for temp-holder (AdSlot, Schlagloch shake)

---

## Previous Last Verified
- Commit: 17c2af7
- Date: 2026-04-20

---

## Release — 2026-04-20 00:15

- Commits: a7859cd..70cfbcf (16 commits)
- Netlify deploy: skipped (MCP permission not granted)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: skipped (MCP permission not granted)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagloch ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl, game removed — SPA shell returns 200)
- Skipped checks: Netlify deploy (MCP permission not granted), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP permission not granted)

### Notable commits
- 70cfbcf feat: how-to-play onboarding modal for all 4 games
- f2d35ab feat: streak prompt — nudge unauthenticated users to create an account after Day 3
- bccba68 feat: polished Schlagloch results screen — share-first layout, countdown, performance tiers
- 6df141c feat: staggered loss reveal for Verbindige — dramatic group-by-group answer unveil
- 2f37b10 feat: streak tracking — calculate and display current streak per game
- 353c9f7 perf: defer Supabase SDK from critical path — entry 60.95KB → 3.65KB gzipped

---

## Release — 2026-04-19 22:30

- Commits: 56df671..a7859cd (3 commits)
- Netlify deploy: skipped (MCP permission not granted)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: skipped (MCP permission not granted)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagloch ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl, game removed — SPA shell returns 200)
- Skipped checks: Netlify deploy (MCP permission not granted), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP permission not granted)

### Notable commits
- 31bc00d fix: standardize puzzle identifier across header, result, and share text
- 503cf71 review: code review findings for temp-holder branch
- a7859cd polish: add subtle pulse animation to ErrorDots on latest filled dot

---

## Release — 2026-04-19 19:45

- Commits: dfe2fa9..56df671 (13 commits)
- Netlify deploy: skipped (MCP permission not granted)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: skipped (MCP permission not granted)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagloch ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl, but game removed in 6fa24b7 — SPA shell returns 200 regardless)
- Skipped checks: Netlify deploy (MCP permission not granted), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP permission not granted)

### Notable commits
- 6fa24b7 feat: remove Buchstäbli game entirely
- 2b906a3 perf: replace full Supabase SDK with postgrest-js — 51.85KB → 7.77KB gzipped
- 789b993 feat: persist game completion state in localStorage
- 9ff71ec polish: respect prefers-reduced-motion — disable confetti, kill transforms
- a487c03 polish: add streak counter display to GameHeader
- 1a2835f fix: display proper German strings for revealed Schlagloch answers
- 5bb45e4 polish: improve ShareButton Web Share API integration

### Notes
Buchstäbli was removed in this release (6fa24b7). The `/buchstaebli` route still returns HTTP 200 because Netlify serves the SPA shell for all routes. Without JS execution (Chrome MCP), we cannot verify whether the app correctly handles this removed route.

---

## Release — 2026-04-19 14:30

- Commits: 621b2d4..dfe2fa9
- Netlify deploy: skipped (MCP permission not granted)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: skipped (MCP permission not granted)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagloch ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl)
- Skipped checks: Netlify deploy (MCP permission not granted), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP permission not granted)

### Notable commits
- dfe2fa9 feat: user accounts with Supabase Auth magic link sign-in
- 0cd5e55 feat: premium Verbindige results screen with performance tiers and animations
- ed06b94 feat: add game feel to Zämesetzli — shake, confetti, rank celebrations
- 6f5e768 feat: finalize share card formats — Schlagloch accuracy grid + CTA
- 17bc2ed feat: add game feel to Schlagloch — shake, toasts, confetti
- 8bd0acd ci: auto-deploy to Netlify on push to main
- b51764b feat: add Verbindige shuffle button with staggered tile animation
- 1c851cb feat: add daily puzzle reset with midnight CET rollover detection
- 7ac73b9 feat: add Buchstäbli shuffle animation and fix share support

---

## Release — 2026-04-18 23:50

- Commits: 70ae58f..621b2d4
- Netlify deploy: skipped (MCP not available)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: skipped (MCP not available)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagloch ✓ (curl), zaemesetzli ✓ (curl)
- Skipped checks: Netlify deploy (MCP not available), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP not available)

### Notable commits
- eeef223 triage: verbindige QA findings from share flow scenario
- d74bb67 triage: schlagloch QA findings from news reader scenario
- 4d6d3bc triage: zaemesetzli QA findings and harden skill push instructions
- 621b2d4 polish: fix share text format — use puzzle dates

---

## Release — 2026-04-18 20:15

- Commits: b7fffbe..70ae58f
- Netlify deploy: skipped (MCP not available)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: skipped (MCP not available)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagloch ✓ (curl), zaemesetzli ✓ (curl)
- Skipped checks: Netlify deploy (MCP not available), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP not available)

### Notable commits
- b20c579 fix: render rank threshold tick marks on RankBar progress bar
- 70ae58f scripts: add launchd agent to regenerate dashboard HTML every 30s

---

## Release — 2026-04-18 16:45

- Commits: 044d701..b7fffbe
- Netlify deploy: skipped (MCP not available)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: skipped (MCP permission not granted)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagloch ✓ (curl), zaemesetzli ✓ (curl)
- Skipped checks: Netlify deploy (MCP not available), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP permission not granted)

### Notable commits
- 6580a97 feat: rank-up celebrations with threshold markers on progress bar
- 16fc3a5 polish: cap toast stack at 3 visible toasts
- d1250ae feat: Supabase puzzle fetch with fallback to sample data
- b7fffbe triage: deduplicate and clean up roadmap findings

---

## Release — 2026-04-18 (initial verification)

- Commits: d2de0ca..044d701 (first full verification, no prior baseline)
- Netlify deploy: unable to check (MCP permission not granted)
- Production health: HEALTHY (limited — SPA shell only, no JS execution)
- HTTP status: all routes 200
- Console errors: not checked (no browser MCP available)
- Supabase: not checked (MCP permission not granted)
- Routes checked (HTTP 200): landing ✓, verbindige ✓, schlagloch ✓, zaemesetzli ✓

### Notes

This is the first release verification. Smoke testing was limited to HTTP status
codes because WebFetch cannot execute JavaScript (SPA renders client-side) and
Chrome MCP / Netlify MCP / Supabase MCP permissions were not available. All four
routes returned HTTP 200, confirming the Netlify deployment is serving the app
shell correctly.

