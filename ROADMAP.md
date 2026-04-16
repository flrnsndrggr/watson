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

1. [ ] P0 - Route `/buchstaebli` does not exist — blank white screen
   - Agent: watson-qa-buchstaebli
   - Scenario: First Play — navigate directly to https://games-watson.netlify.app/buchstaebli
   - Problem: The route `/buchstaebli` is not registered in the React Router config. Navigating to it produces a blank white page with no content or error message shown to the user.
   - Suggested fix: Add a `<Route path="/buchstaebli" element={<BuchstaebliPage />} />` entry in the router (likely `src/App.tsx` or equivalent routing file). The game files exist at `src/games/buchstaebli/` per AGENTS.md but the route is missing.
   - Files: `src/App.tsx` (or router config), `src/games/buchstaebli/`
   - Evidence: Console warning "No routes matched location '/buchstaebli'" (React Router). Page renders empty white body. Observed 2026-04-16.

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
