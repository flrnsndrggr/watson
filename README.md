# games-watson

Daily word games in Swiss German for watson.ch readers.

## Games

| Game | Route | Description |
|---|---|---|
| Verbindige | `/verbindige` | Group 16 Swiss German words into 4 thematic categories |
| Schlagloch | `/schlagloch` | Guess the watson.ch headline from a partial reveal |
| Zämesetzli | `/zaemesetzli` | Combine emoji pairs to form Swiss German compound words |

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Edge Functions)
- **Deployment:** Netlify (`games-watson.netlify.app`)

## Run Locally

```bash
npm install
npm run dev
```

Requires a `.env.local` with Supabase credentials:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Admin Panel

Protected at `/admin` — requires Supabase auth. Includes puzzle editors for Verbindige, Schlagloch, and Zämesetzli.

## Mundart Word Sourcing

All Swiss German words trace to the [Schweizerisches Idiotikon](https://digital.idiotikon.ch). See [MUNDART-SOURCING.md](MUNDART-SOURCING.md) for the data pipeline.

## Docs

- [AGENTS.md](AGENTS.md) — agent operating contract (conventions, brand tokens, git rules)
- [ROADMAP.md](ROADMAP.md) — QA findings and issue tracker
- [docs/feature-backlog.md](docs/feature-backlog.md) — feature work queue
- [docs/polish-checklist.md](docs/polish-checklist.md) — UX polish queue
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — changelog
