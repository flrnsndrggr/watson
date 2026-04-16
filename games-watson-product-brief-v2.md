# games.watson.ch — Product Brief

**Date:** April 2026
**Owner:** Florian Sonderegger, Commercial Director Digital
**For:** CH Media product, editorial, and commercial stakeholders

---

## One-Liner

A daily games destination on watson.ch — three original, Swiss-culturally specific word and knowledge games, free and ad-supported, designed to create habitual daily visits and generate CHF 1M+ in incremental annual ad revenue.

---

## Problem

watson.ch gets ~20M visits/month, but the vast majority are single-session, platform-referred (35–45% from Google). Users read an article and leave. There is no daily habit mechanic — no reason to come back to watson.ch directly, every day, without a push notification or algorithm deciding to show a watson link.

Meanwhile, watson.ch's existing interactive content (Quiz section, Kreuzworträtsel) is fragmented, unbranded, embedded via iframes, and not designed for retention. It's content, not product.

## Opportunity

NYT Games drives over $289M/quarter in digital subscription revenue. Der Spiegel's daily quiz reaches 900K users. Games are the highest-engagement, highest-retention product surface in digital media — and watson.ch has zero presence here despite having the ideal audience (young, digital-native, mobile-first) and the ideal brand tone (playful, smart, Swiss).

The window: no Swiss German-language publisher has built a native games product yet. NZZ, BLICK, and others use generic white-label HTML5 embeds (Playground platform). First mover with an editorially integrated, culturally specific product owns this space.

---

## Solution: Three Daily Games

### 1. Verbindige (Mundart Connections)
16 arcane Swiss German dialect words in a 4×4 grid → sort into 4 groups of 4. The twist: the words themselves are the puzzle. Players must first decode what the Mundart words mean, then figure out how they group. Double cognitive layer — no other Connections variant does this.

**Example:** "Gring, Grind, Bire, Tscholi" → all mean "Kopf" in different cantonal dialects. "Güxi, Velo, Töffli, Trottinett" → all vehicles.

**Core loop:** Open → stare at 16 unfamiliar dialect words → hypothesize meaning → hypothesize grouping → select 4 → submit → category label reveals the "aha!" → share result + argue about words on WhatsApp.

### 2. Zämesetzli (Compound Word Builder)
A pool of 10 emojis. Combine any 2 (or 3) to form valid German compound words. Find as many as possible. Open-ended discovery — no single solution path. Each daily set has 12–20 valid combinations, from obvious (🏠+🔑 = Hausschlüssel) to creative (🧀+⛰️ = Alpkäse).

**Core loop:** Open → scan emoji pool → spot a combination → drag/tap emojis together → type compound word → validate → hunt for more → chase "Bundesrat" rank → share score + best finds.

### 3. Schlagziil (The watson Headline Game)
5 headlines from watson.ch's entire archive — spanning years, from founding to today. Each has a key word blanked out. Guess the missing word. 3 wrong guesses total. Year is shown as context clue.

**Example:** 🕐 2023 — "Credit Suisse wird von _____ übernommen" → UBS. 🕐 2019 — "Greta Thunberg spricht am WEF in _____" → DAVOS.

**Core loop:** Open → read headline + year → type guess → correct/wrong → tap to read original watson article → next headline → share results with year stamps. The game IS watson's editorial history.

---

## Key Design Principles

1. **Daily cadence, midnight reset.** One new puzzle per game per day. No infinite play. Scarcity creates habit.
2. **30-second onboarding.** Rules must be understood without reading instructions. Show, don't tell. First-play tutorial built into gameplay.
3. **Mobile-first, desktop-beautiful.** 80%+ of watson traffic is mobile. Games must work perfectly on a 375px-wide screen with one thumb.
4. **Share-native.** Every game produces a shareable result (emoji grid, score badge, headline accuracy). Designed for WhatsApp and Instagram Stories. The share card IS the growth engine.
5. **Swiss, not generic.** Swiss German words, Swiss geography, Swiss cultural references, watson headlines. This can't be replicated by an English-language competitor or a white-label provider.
6. **Ad-funded, not paywalled.** Free to play, always. Revenue from sponsorship, display, interstitial, and branded editions. No "play 3 free, then pay" gating.

---

## User Journey

```
Day 1:  User sees friend's Verbindige result on WhatsApp: "Hesch gwüsst dass Tscholi Chopf heisst?!"
        → taps link → lands on watson.ch/spiele/verbindige
        → plays (no account needed) → gets result → shares own result
        → notices Zämesetzli and Schlagziil → plays one more

Day 3:  User returns directly (bookmark/app)
        → prompt: "Willst du deinen Streak behalten? Konto erstellen."
        → creates account (email + username) → streak counter starts

Day 14: User has 14-day streak across Verbindige + Zämesetzli
        → leaderboard unlocked → sees friends' scores
        → push notification opt-in → daily 8am reminder

Day 30: User is a daily player (4+ sessions/week)
        → reads watson archive articles linked from Schlagziil headlines
        → watson has first-party profile (email, play history, inferred interests)
        → sees premium sponsor content in games context
        → Schlagziil surfaces a 2019 headline → user discovers watson article they missed → archive page view + ad impression
```

---

## Information Architecture

```
watson.ch
├── Navigation: Schweiz | International | ... | Spiele ← (replaces "Quiz")
│
├── games.watson.ch (or watson.ch/spiele/)
│   ├── Landing page — today's 3 games, streaks overview, leaderboard teaser
│   ├── /verbindige — daily Mundart connections puzzle + archive
│   ├── /zaemesetzli — daily emoji compound word builder
│   ├── /schlagziil — daily watson archive headline game
│   ├── /profil — streaks, stats, leaderboard position
│   └── /archiv — past puzzles (play missed days, no streak credit)
│
├── Existing quizzes migrate under /spiele/quiz/
│   ├── Quizz den Huber
│   ├── Quizzticle
│   └── Aufgedeckt
│
└── Kreuzworträtsel migrates under /spiele/kreuzwortraetsel/
```

---

## Competitive Positioning

| Feature | NYT Games | Playground (NZZ/BLICK) | games.watson.ch |
|---|---|---|---|
| Daily puzzles | ✅ | ❌ (casual, no daily) | ✅ |
| Original game mechanics | ✅ | ❌ (white-label) | ✅ (all 3 are novel) |
| Swiss dialect as gameplay | ❌ | ❌ | ✅ (Verbindige, Zämesetzli) |
| Publisher archive integration | ❌ | ❌ | ✅ (Schlagziil) |
| Emoji-based gameplay | ❌ | ❌ | ✅ (Zämesetzli) |
| German compound word mechanics | ❌ (English) | ❌ | ✅ (language-native) |
| Streaks & leaderboards | ✅ | ❌ | ✅ |
| Social sharing | ✅ | ❌ | ✅ |
| Free (no paywall) | ❌ (subscription) | ✅ | ✅ |
| Sponsorship model | ❌ | ✅ (generic) | ✅ (editorial partnership) |
| Mobile-first design | ✅ | ⚠️ | ✅ |

---

## Revenue Model Summary

- **Sponsorship:** CHF 15–25K/month per game (3 games = CHF 45–75K/month)
- **Display/interstitial:** CHF 35–50 CPM (premium attention context)
- **Branded editions:** CHF 5–10K per custom puzzle
- **Year 1 target:** CHF 1.0–1.2M incremental revenue
- **Breakeven:** Month 8–10

---

## Dependencies & Assumptions

1. **Puzzle Editor hire** is critical. Games live or die on daily puzzle quality. Must be a native Swiss German speaker with cross-cantonal vocabulary knowledge. This is not automatable (yet).
2. **Swiss German word list** needs curation for Verbindige (arcane Mundart words) and Zämesetzli (compound word validation). Start with Schweizerisches Idiotikon + Duden + ~2,000 validated Mundart entries. Community submissions pipeline needed.
3. **watson article archive API** required for Schlagziil — needs structured access to headline text, publish date, article URL, and category across the full watson.ch archive. Dead links and deleted articles must be filtered out.
4. **Emoji-to-noun mapping** for Zämesetzli — each emoji needs a canonical German noun (visible on hover/long-press) to reduce ambiguity. ~100 emojis curated at launch.
5. **OneID integration** is a medium-term dependency (M3–M6), not a launch blocker. Launch with simple email accounts, migrate to OneID.
6. **No app at launch.** Mobile web only. App is M12–M18 roadmap item.

---

## Success Criteria (Go/No-Go at M3)

| Metric | M3 Threshold | Action if Below |
|---|---|---|
| Daily Active Players | ≥20K | Reassess game selection, increase marketing |
| 7-day retention | ≥25% | Investigate difficulty calibration, onboarding |
| Social shares/day | ≥1K | Redesign share cards, add incentives |
| Sponsor pipeline | ≥2 signed | Adjust pricing, broaden sales approach |

If all four metrics are below threshold at M3, pause investment and conduct post-mortem before continuing.

---

## Open Questions

1. **Subdomain vs. path?** `games.watson.ch` (cleaner brand, harder SEO) vs. `watson.ch/spiele/` (inherits domain authority, messier IA). Recommend path for SEO, brand as "watson Spiele."
2. **Puzzle archive access** — should past puzzles be freely available or gated (account required)?
3. **French localization timeline** — watson.ch/fr exists but is smaller. Zämesetzli and Schlagziil are localizable; Verbindige (Mundart) is inherently Swiss German. Phase 2 or later?
4. **Kreuzworträtsel migration** — current iframe embed from third-party. Rebuild natively or keep as-is under new IA?
5. **Zämesetzli emoji rendering** — emoji appearance varies across OS/devices. Use custom SVG icons instead, or accept platform-native emoji rendering?
6. **Schlagziil archive depth** — how far back? watson.ch launched 2014. Older headlines may lack context for younger players. Include "Kontext" expandable with 1-sentence story summary?

---

*"Spiel, aber deep."*
