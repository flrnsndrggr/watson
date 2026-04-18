# Release Log

## Release — 2026-04-18 16:45

- Commits: 044d701..b7fffbe
- Netlify deploy: skipped (MCP not available)
- Production health: UNKNOWN
- HTTP status: all routes 200
- Console errors: skipped (Chrome MCP not available)
- Supabase: skipped (MCP permission not granted)
- Routes checked: landing ✓ (curl), verbindige ✓ (curl), schlagziil ✓ (curl), zaemesetzli ✓ (curl), buchstaebli ✓ (curl)
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
- Routes checked (HTTP 200): landing ✓, verbindige ✓, schlagziil ✓, zaemesetzli ✓, buchstaebli ✓

### Notes

This is the first release verification. Smoke testing was limited to HTTP status
codes because WebFetch cannot execute JavaScript (SPA renders client-side) and
Chrome MCP / Netlify MCP / Supabase MCP permissions were not available. All five
routes returned HTTP 200, confirming the Netlify deployment is serving the app
shell correctly.

## Last Verified
- Commit: b7fffbe
- Date: 2026-04-18
