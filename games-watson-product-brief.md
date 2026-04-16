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

### 1. Verbindige (Swiss Connections)
16 items in a 4×4 grid → sort into 4 groups of 4. Swiss-themed categories. Occasionally uses images. One category per week ties to watson's biggest news story.

**Core loop:** Open → scan grid → hypothesize groups → tap to select → submit → success/fail → share emoji result.

### 2. Buchstäbli (Swiss Word Hex)
7 letters in a hex grid → make as many German words as possible (min. 4 letters, center letter required). Find the Pangram. Swiss German dialect words earn 2× points.

**Core loop:** Open → see letters → type words → validate → track score → chase "Bundesrat" rank → share score.

### 3. Schlagziil (The Headline Game)
5 real watson.ch headlines from the past week, each with a key word blanked out. Guess all 5. 3 wrong guesses allowed across all 5.

**Core loop:** Open → read headline → type guess → correct/wrong → next headline → see results → tap headline to read full article → share.

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
Day 1:  User sees friend's Verbindige emoji grid on WhatsApp
        → taps link → lands on games.watson.ch/verbindige
        → plays (no account needed) → gets result → shares own result
        → notices Buchstäbli and Schlagziil → plays one more

Day 3:  User returns directly (bookmark/app)
        → prompt: "Willst du deinen Streak behalten? Konto erstellen."
        → creates account (email + username) → streak counter starts

Day 14: User has 14-day streak across Verbindige + Buchstäbli
        → leaderboard unlocked → sees friends' scores
        → push notification opt-in → daily 8am reminder

Day 30: User is a daily player (4+ sessions/week)
        → reads watson articles linked from Schlagziil headlines
        → watson has first-party profile (email, play history, inferred interests)
        → sees premium sponsor content in games context
```

---

## Information Architecture

```
watson.ch
├── Navigation: Schweiz | International | ... | Spiele ← (replaces "Quiz")
│
├── games.watson.ch (or watson.ch/spiele/)
│   ├── Landing page — today's 3 games, streaks overview, leaderboard teaser
│   ├── /verbindige — daily puzzle + archive
│   ├── /buchstaebli — daily puzzle
│   ├── /schlagziil — daily puzzle
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
| Swiss cultural content | ❌ | ❌ | ✅ |
| News-integrated games | ❌ | ❌ | ✅ (Schlagziil) |
| Swiss German language | ❌ | ❌ | ✅ (Buchstäbli Mundart) |
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

1. **Puzzle Editor hire** is critical. Games live or die on daily puzzle quality. This is not automatable (yet).
2. **Swiss German word list** needs curation. Start with Duden + ~2,000 validated Mundart entries. Community submissions pipeline needed.
3. **watson editorial buy-in** required for Schlagziil (editors flag 5 headlines/day for game use) and Verbindige (occasional current-events categories).
4. **OneID integration** is a medium-term dependency (M3–M6), not a launch blocker. Launch with simple email accounts, migrate to OneID.
5. **No app at launch.** Mobile web only. App is M12–M18 roadmap item.

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
3. **French localization timeline** — watson.ch/fr exists but is smaller. Games localization in Phase 2 or later?
4. **Kreuzworträtsel migration** — current iframe embed from third-party. Rebuild natively or keep as-is under new IA?

---

*"Spiel, aber deep."*
