# Changelog

## 2026-04-16

### Features
- Add admin panel with auth, Idiotikon sourcing docs and scripts (`f7b97e4`)
  - `/admin` route with protected dashboard, puzzle editors for Verbindige, Zämesetzli, Schlagziil
  - `src/lib/auth.tsx` — Supabase auth context/provider
  - `src/lib/idiotikon.ts` — Idiotikon API client
  - `MUNDART-SOURCING.md` — data pipeline docs for Mundart word sourcing
  - `scripts/seed-from-idiotikon.ts` + `mundart-word-bank.json` (79+ verified words)

### Docs
- Add agent operating contract, roadmap, and backlogs (`1729e42`)
  - `AGENTS.md` — project conventions, brand tokens, git rules for all agents
  - `ROADMAP.md` — QA issue tracker
  - `docs/feature-backlog.md` — feature work queue
  - `docs/polish-checklist.md` — UX polish queue

### Init
- Initial games-watson project scaffolding (`91d0e17`)
