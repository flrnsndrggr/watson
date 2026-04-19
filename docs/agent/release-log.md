# Release Log

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

## Last Verified
- Commit: dfe2fa9
- Date: 2026-04-19
