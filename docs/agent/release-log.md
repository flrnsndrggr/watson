# Release Log

## Release — 2026-04-20 15:30

- Commits: 70cfbcf..17c2af7 (10 commits)
- Netlify deploy: skipped (MCP not available)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: skipped (MCP not available)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagziil ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl, game removed — SPA shell returns 200)
- Skipped checks: Netlify deploy (MCP not available), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP not available)

### Notable commits
- 87dbe18 feat: wrong-answer shake feedback for Schlagziil headline cards
- 41077ee polish: AdSlot placeholder with dashed border and "Anzeige" label
- 17c2af7 docs: mark skeleton loader polish item complete
- 8299d89 docs: sync changelog and update documentation
- be79180 review: incremental code review for temp-holder (AdSlot, Schlagziil shake)

---

## Last Verified
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
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagziil ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl, game removed — SPA shell returns 200)
- Skipped checks: Netlify deploy (MCP permission not granted), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP permission not granted)

### Notable commits
- 70cfbcf feat: how-to-play onboarding modal for all 4 games
- f2d35ab feat: streak prompt — nudge unauthenticated users to create an account after Day 3
- bccba68 feat: polished Schlagziil results screen — share-first layout, countdown, performance tiers
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
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagziil ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl, game removed — SPA shell returns 200)
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
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagziil ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl, but game removed in 6fa24b7 — SPA shell returns 200 regardless)
- Skipped checks: Netlify deploy (MCP permission not granted), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP permission not granted)

### Notable commits
- 6fa24b7 feat: remove Buchstäbli game entirely
- 2b906a3 perf: replace full Supabase SDK with postgrest-js — 51.85KB → 7.77KB gzipped
- 789b993 feat: persist game completion state in localStorage
- 9ff71ec polish: respect prefers-reduced-motion — disable confetti, kill transforms
- a487c03 polish: add streak counter display to GameHeader
- 1a2835f fix: display proper German strings for revealed Schlagziil answers
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
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagziil ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl)
- Skipped checks: Netlify deploy (MCP permission not granted), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP permission not granted)

### Notable commits
- dfe2fa9 feat: user accounts with Supabase Auth magic link sign-in
- 0cd5e55 feat: premium Verbindige results screen with performance tiers and animations
- ed06b94 feat: add game feel to Zämesetzli — shake, confetti, rank celebrations
- 6f5e768 feat: finalize share card formats — Schlagziil accuracy grid + CTA
- 17bc2ed feat: add game feel to Schlagziil — shake, toasts, confetti
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
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagziil ✓ (curl), zaemesetzli ✓ (curl)
- Skipped checks: Netlify deploy (MCP not available), Chrome smoke test / JS render / console errors (Chrome MCP not available), Supabase logs (MCP not available)

### Notable commits
- eeef223 triage: verbindige QA findings from share flow scenario
- d74bb67 triage: schlagziil QA findings from news reader scenario
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
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagziil ✓ (curl), zaemesetzli ✓ (curl)
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
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagziil ✓ (curl), zaemesetzli ✓ (curl)
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
- Routes checked (HTTP 200): landing ✓, verbindige ✓, schlagziil ✓, zaemesetzli ✓

### Notes

This is the first release verification. Smoke testing was limited to HTTP status
codes because WebFetch cannot execute JavaScript (SPA renders client-side) and
Chrome MCP / Netlify MCP / Supabase MCP permissions were not available. All four
routes returned HTTP 200, confirming the Netlify deployment is serving the app
shell correctly.

