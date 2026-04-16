# games.watson.ch — Product Strategy

**Version:** 1.0 — April 2026
**Author:** Florian Sonderegger / Commercial Director Digital, CH Media
**Status:** Draft for internal alignment

---

## 1. Strategic Context

### Why Games, Why Now

watson.ch faces a structural revenue threat: 35–50% Google traffic erosion by 2031, an 18–24 month window for counter-measures, and a 100% ad-funded model with zero subscription revenue. The core strategic question is how to build owned, habitual audience relationships that don't depend on platform-distributed reach.

Games are the answer to three problems simultaneously:

1. **Habit formation without a paywall.** NYT proved games drive daily return visits better than any content format. Der Spiegel gets 900K daily quiz players. watson.ch already has quiz DNA ("Quizz den Huber," Quizzticle, Kreuzworträtsel) — but it's scattered, unbranded, and under-monetized.

2. **First-party data at scale.** Every game session is a logged engagement event. With OneID integration, games become a low-friction first-party data collection surface — users willingly identify themselves to track streaks, compete on leaderboards, and share results.

3. **Ad inventory that doesn't feel like ads.** Games pages have 3–5x the time-on-site of article pages. Interstitial, rewarded, and sponsorship ad formats in games contexts command premium CPMs because attention is voluntary and focused.

### What We Learned from NYT (and What Doesn't Apply)

**NYT model — what works:**
- Daily cadence creates habit (one puzzle per day, resets at midnight)
- Streak mechanics drive return visits (losing a streak hurts)
- Shareability (emoji grid results on social → organic reach)
- Simple rules, deep skill curve (learn in 10 seconds, master over months)
- Multi-product bundle reduces churn (news + games + cooking)

**What doesn't apply to watson.ch:**
- NYT uses games as subscription fuel → watson.ch is ad-funded, no paywall
- NYT games are language-generic English → watson.ch serves Swiss German speakers with a specific cultural identity
- NYT games are standalone/abstract → watson.ch can tie games to its own editorial content (a unique advantage no pure games platform has)

### European Precedent

- **Le Monde** → arcade.lemonde.fr: free casual HTML5 games (Solitaire, Sudoku, Mahjong), white-label, no editorial integration
- **Der Spiegel** → 900K daily news quiz users, free-to-play as habit → subscription funnel
- **BILD, NZZ, BLICK** → all use the "Playground" white-label HTML5 platform for basic games

watson.ch should leapfrog these generic white-label approaches. The opportunity is an editorially integrated, Swiss-culturally specific games experience that is as distinctive as watson's voice.

---

## 2. Product Vision

**games.watson.ch** is watson's daily play destination — three original games rooted in Swiss German culture, language, and watson's own news coverage. Free, ad-supported, mobile-first. One new puzzle per game per day. Streaks, sharing, leaderboards. The goal: make watson the first app opened in the morning, not just the first article scrolled past.

**Tagline:** *"Spiel, aber deep."* (mirroring "News, aber deep.")

### Target Audience

watson.ch's core: 14–34 year olds, Swiss German-speaking, mobile-first, left-liberal, digitally native. This audience already plays NYT games, has Duolingo streaks, shares results on Instagram stories. They understand game mechanics intuitively. They're also the audience most at risk of platform leakage (TikTok, Instagram, AI chat) — games give them a reason to come to watson.ch directly.

### Success Metrics (12-Month Targets)

| Metric | Target | Rationale |
|---|---|---|
| Daily Active Players (DAP) | 50K by M6, 150K by M12 | ~3% of watson.ch monthly users → daily habit |
| Games sessions / user / week | ≥4 | Habit threshold (more than half the days) |
| Avg. time on games.watson.ch | ≥4 min/session | 3–5x article page dwell time |
| Streak retention (7-day) | ≥35% | Users maintaining a 7+ day streak |
| Social shares / day | 5K+ | Earned distribution (organic reach) |
| First-party data opt-in rate | ≥40% of players | OneID-linked accounts via streak/leaderboard |
| Incremental ad revenue (M12) | CHF 500K–800K | Sponsorship + display + interstitial |
| Avg. games CPM | CHF 35–50 | Premium vs. standard watson display (~CHF 20–25) |

---

## 3. The Three Launch Games

### Game 1: "Verbindige" — Mundart Connections

**Concept:** 16 arcane Swiss German dialect words displayed in a 4×4 grid. Group them into 4 categories of 4. You get 4 mistakes before game over. One new puzzle daily.

**What makes this NOT a Connections clone:**
The items aren't everyday words in a Swiss context — they're deep-cut Mundart that most Swiss Germans half-recognize but can't quite place. The puzzle has two layers: first you have to figure out what the words *mean*, then you have to figure out how they *group*. NYT Connections assumes you know the words and tests categorization. Verbindige tests linguistic knowledge AND categorization simultaneously.

**Example puzzle:**
- Group 1 (yellow — easy): "Rüebli, Härdöpfel, Kabis, Nüssli" → *Gemüse (Mundart-Bezeichnungen)*
- Group 2 (green — medium): "Güxi, Velo, Töffli, Trottinett" → *Fahrzeuge*
- Group 3 (blue — hard): "Chrüsimüsi, Puff, Sürmel, Tohuwabohu" → *Wörter für Unordnung/Chaos*
- Group 4 (purple — evil): "Gring, Grind, Bire, Tscholi" → *Mundart-Wörter für Kopf*

The purple category is designed to be deceptive — words that *sound* like they belong in different groups but share a hidden connection. Players who grew up in different cantons will have different intuitions, creating natural debate and sharing.

**Why it works:**
- Genuinely educational — players learn obscure Swiss German words they didn't know
- Creates regional pride/rivalry (Bärner vs. Zürcher vs. Basler vocabulary)
- Extremely shareable — "Hesch gwüsst dass Tscholi au Chopf heisst?!" drives WhatsApp conversation
- Difficulty scales naturally from common Mundart (everyone knows Rüebli) to deep dialect (who outside Appenzell knows "Bschtungg"?)
- The double-decode mechanic (meaning + grouping) is a structural innovation, not a skin

**Content sourcing:** Schweizerisches Idiotikon (historical Swiss German dictionary), Mundart-Lexikon, watson editorial curation. Puzzle editor must be a native Swiss German speaker with cross-cantonal vocabulary.

**Difficulty curve:** Color-coded (yellow/green/blue/purple). Category labels are revealed in Hochdeutsch after solving — the "aha!" of seeing the grouping logic is the dopamine hit.

---

### Game 2: "Zämesetzli" — Compound Word Builder

**Concept:** You get a pool of 10 emojis/icons. Combine any 2 (or 3) to form valid German compound words. Find as many as possible. One new emoji set daily.

**How it works:**
- Each day: 10 emojis appear (e.g., 🏠 🔑 🌳 🍎 ⛰️ 🧀 🔔 🐄 ☀️ 🚪)
- Players drag/tap two (or three) emojis together and type the compound word they form
- Valid examples from this set: 🏠+🔑 = Hausschlüssel, 🐄+🔔 = Kuhglocke, 🏠+🚪 = Haustür, 🍎+🌳 = Apfelbaum, ☀️+🌳 = Sonnenbaum? (invalid) → ☀️+🔔 = Sonnenuhr? (not quite) → ☀️+⛰️ = Sonnenberg (valid!)
- The puzzle editor pre-validates all possible combinations. Each set has 12–20 valid compound words, but some are obvious and others require lateral thinking.
- Scoring: common compounds = 1pt, uncommon = 2pt, rare/creative = 3pt. Finding all valid words in a set = "Meisterstück" badge.

**Why it's genuinely original:**
- No equivalent in any games ecosystem — not NYT, not Wordle variants, not Le Monde. The mechanic is rooted in a structural feature of the German language that English simply doesn't have.
- Visual-first: emojis as game pieces make it instantly legible, mobile-native, and fun to screenshot/share.
- Open-ended: there's no single solution path. Different players find different words first. This creates natural "how did I miss that?!" moments and conversation.
- Swiss German compounds as bonus layer: 🧀+⛰️ = Käseberg (nah) vs. Alpkäse (yes, 3pt Mundart bonus!)
- Low cognitive entry, high mastery ceiling. A 10-year-old can combine 🏠+🔑. A language nerd will hunt for the 18th compound word for 20 minutes.

**Rank system:** "Stift → Lehrling → Geselle → Meister → Bundesrat" (based on % of valid words found).

**Dictionary:** Server-side validated. Duden compounds + curated Swiss German compounds (~500 at launch). Community submission pipeline for new compounds.

---

### Game 3: "Schlagziil" — The watson Headline Game

**Concept:** 5 headlines drawn from watson.ch's entire archive — from today back to watson's founding. Each headline has a key word or phrase blanked out. Guess the missing word. 3 wrong guesses total across all 5.

**The full-archive twist changes everything:**
This isn't "what happened this week" — it's "how well do you know watson and the stories that shaped Swiss news?" Headlines span years: a 2024 Federal Council election, a 2019 climate strike, a 2026 AI regulation vote, a 2017 FIFA scandal with Swiss connections. The game becomes a time capsule of Swiss public life, told through watson's editorial voice.

**Example round:**
> 🕐 2024 — "Die Schweiz stimmt über die _____-Initiative ab" → 13. AHV-RENTE
> 🕐 2019 — "Greta Thunberg spricht am WEF in _____" → DAVOS
> 🕐 2026 — "watson enthüllt: _____ betreibt illegale Datensammlung" → [current story]
> 🕐 2017 — "Die Nati scheitert an _____ in der WM-Quali" → NORDIRLAND (nein → SCHWEDEN)
> 🕐 2023 — "Credit Suisse wird von _____ übernommen" → UBS

**Why the full archive is better than "this week":**
- **Depth of tie to watson:** The game IS watson's identity. It says "we've been covering Swiss life for a decade+, and these are the moments that mattered." No other publisher can steal this — it's watson's own editorial history.
- **Broader knowledge test:** Not just "did you read watson today" but "do you know Swiss news?" This makes it accessible to non-daily readers too.
- **Nostalgia and rediscovery:** Old headlines surface forgotten stories. Players tap through to the original articles. Watson's archive gets a second life — and a second round of ad impressions on long-tail content.
- **Evergreen content engine:** The archive is massive. You can run this game for years without repeating.
- **Difficulty mixing:** Each day's 5 headlines mix eras and topics. 2 easy (recent, major events), 2 medium (older or niche), 1 hard (deep cut). The timestamp hint narrows the possibility space without giving it away.

**Shareable results:**
```
Schlagziil #042 📰 4/5
🟩🟩🟥🟩🟩
2024 ✓ | 2019 ✓ | 2026 ✗ | 2017 ✓ | 2023 ✓
Kennst du watson? watson.ch/spiele/schlagziil
```

**Content pipeline:**
- Puzzle editor curates from watson.ch article database (10K+ headlines available)
- Each headline pre-validated with 2–3 accepted answer variants (spelling, abbreviation, synonym)
- Year/era shown as context clue
- Every headline links to original watson article (drives archive traffic)
- Zero new content creation needed — watson's backlog IS the game

---

## 4. Monetization Model

watson.ch is ad-funded. Games must generate revenue from day one, not "build audience first, monetize later."

### Revenue Streams

**A. Sponsorship (Primary — 50–60% of games revenue)**
- **Presented by [Brand]:** Title sponsorship per game, per month. "Verbindige — presented by Swisscom." Logo placement, branded category (e.g., one Verbindige group per week is brand-themed).
- **Pricing:** CHF 15K–25K/month per game sponsorship (premium positioning, guaranteed daily impressions).
- **CH Media Mind integration:** Sponsorships sold as editorial partnerships, not banner buys. Content-led commercial products at consulting margins.

**B. Display & Interstitial (30–35%)**
- Pre-game interstitial (5-second ad before puzzle loads) — high viewability, non-skippable
- Post-game display (shown with results) — high attention context
- Sidebar/below-game display on desktop
- Expected CPM: CHF 35–50 (vs. watson.ch standard ~CHF 20–25)

**C. Branded Games / Special Editions (10–15%)**
- Custom one-off puzzles for brand campaigns. E.g., a "Verbindige" where all 16 items relate to a brand launch.
- Pricing: CHF 5K–10K per branded edition.
- Maximum 1 branded edition per game per month (protect editorial credibility).

### Revenue Projection (Year 1)

| Stream | Calculation | Annual |
|---|---|---|
| Sponsorship (3 games × CHF 20K/mo × 10 months) | 3 × 20K × 10 | CHF 600K |
| Display/interstitial (150K DAP × CHF 40 CPM × 365) | 150K × 0.04 × 365 ÷ 1000 × pageviews | CHF 300K |
| Branded editions (2/mo × CHF 7.5K × 12) | 2 × 7.5K × 12 | CHF 180K |
| **Total Year 1** | | **CHF ~1.1M** |

Conservative estimate. Assumes ramp-up in H1, full monetization in H2. At scale (300K+ DAP), this doubles.

---

## 5. First-Party Data Strategy

Every game interaction is a first-party data event. The strategy:

1. **Anonymous play allowed** — no friction to start. Zero registration required for first play.
2. **Streak unlock at Day 3** — after 3 consecutive days, prompt: "Willst du deinen Streak behalten? Erstelle ein Konto." Simple email + username. OneID-compatible.
3. **Leaderboard unlock at account creation** — see how you rank vs. friends, vs. Switzerland.
4. **Progressive profiling** — over time, collect: age bracket, canton, interests (inferred from game choices and article clicks).
5. **OneID integration** — games accounts feed into the cross-publisher first-party data initiative, increasing watson.ch's data asset value across the CH Media / Audienzz / Goldbach ecosystem.

**Target:** 40% of regular players (4+ sessions/week) create accounts within 60 days. At 150K DAP, that's 60K new first-party profiles in Year 1.

---

## 6. Distribution & Launch Strategy

### Earned Distribution First

- **Social sharing mechanics** built into every game: emoji-grid results (Verbindige), compound word discoveries (Zämesetzli), headline accuracy + year stamps (Schlagziil). Designed for WhatsApp, Instagram Stories, and TikTok screenshots.
- **watson editorial integration:** daily "Heute auf games.watson.ch" teaser in the watson.ch feed. Games results mentioned in Picdump/Spass content.
- **Push notifications:** opt-in daily reminder at configurable time. "Dein tägliches Verbindige wartet."

### Launch Phases

**Phase 0 — Soft Launch (Week 1–2):**
Internal + friends & family. Shake out bugs, calibrate difficulty.

**Phase 1 — Editorial Launch (Week 3–4):**
watson.ch homepage integration. Dedicated editorial coverage ("watson hat jetzt Games — so funktioniert's"). Category nav updated: Quiz → **Spiele** (rebrand Quiz section, absorb existing quizzes + new games).

**Phase 2 — Social Push (Week 5–8):**
Influencer seeding (Swiss German creators on TikTok/Instagram). Sharing incentives (share your Verbindige result → enter weekly prize draw). watson social channels push daily.

**Phase 3 — Sponsorship Sales (Week 4+, parallel):**
CH Media Mind sells launch sponsorships. Target: 1 sponsor per game at launch. First-mover premium pricing.

---

## 7. Roadmap Beyond Launch

| Timeline | Milestone |
|---|---|
| M0–M3 | Launch 3 games. Iterate difficulty, fix UX, establish baseline metrics. |
| M3–M6 | Introduce streaks leaderboard (national + friends). OneID integration live. |
| M6–M9 | Game 4: "Übersetzig" (daily Swiss dialect translation game — Mundart ↔ Hochdeutsch, rotating cantons). |
| M9–M12 | watson.ch/fr games localization (French versions of Zämesetzli + Schlagziil). |
| M12–M18 | watson Games app (standalone, App Store / Play Store). Push notification layer. |
| M18–M24 | Premium tier exploration: ad-free games for CHF 2.90/month (test subscription appetite). |
| Ongoing | Community puzzle submissions. User-generated Verbindige categories. |

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Low adoption — games don't find audience | Revenue miss, wasted dev investment | Soft launch + iterate. Kill underperforming games fast, double down on winners. |
| "Just another NYT clone" perception | Brand damage, press mockery | Swiss cultural specificity is the defense. Schlagziil is genuinely unique. Lead PR with that. |
| Difficulty calibration wrong | Players churn (too hard) or get bored (too easy) | Dedicated puzzle editor role. A/B test difficulty. Community feedback loop. |
| Sponsor interference with editorial integrity | Credibility loss | Hard cap: max 1 branded edition/game/month. Sponsors never influence editorial puzzle content. |
| Technical: iframe embed fragility (current Kreuzworträtsel approach) | Broken UX, slow loads, mobile issues | Build native (React), not iframe embeds. See Dev Brief. |
| Swiss German dictionary gaps (Verbindige + Zämesetzli) | Player frustration ("my word isn't accepted!") | Launch with conservative dictionary + community submission pipeline. Add words weekly. |
| Schlagziil archive gaps | Older headlines may be broken, missing, or contextually confusing | Pre-validate archive headlines. Exclude articles with dead links. Add year/context cues. |
| Emoji ambiguity in Zämesetzli | Players interpret emojis differently than intended | Each emoji has a canonical German noun label (visible on hover/long-press). Accepted answers cover reasonable interpretations. |

---

## 9. Team & Resources

| Role | FTE | Notes |
|---|---|---|
| Product Manager (Games) | 0.5 | Can be existing watson product lead |
| Puzzle Editor / Game Designer | 1.0 | **Critical hire.** Creates daily puzzles, calibrates difficulty, curates Swiss word lists. |
| Frontend Developer | 1.5 | React/TypeScript. Mobile-first. 3-month build, then maintenance. |
| Backend Developer | 0.5 | API, leaderboards, analytics, OneID integration. |
| Designer | 0.3 | Initial UI/UX, then template-based. |
| Editorial integration | 0.2 | watson editors flag headlines for Schlagziil, suggest Verbindige themes. |
| **Total** | **~4 FTE** | **For 3 months build + ongoing ~2 FTE maintenance** |

**Estimated build cost:** CHF 250K–350K (3-month sprint to MVP launch).
**Ongoing annual cost:** CHF 300K–400K (puzzle editor + 1.5 dev + PM share).
**Breakeven:** Month 8–10 at projected adoption rates.

---

*This is a watson product. It should feel like watson — smart, cheeky, Swiss, young. Not a generic puzzle platform with a watson logo slapped on top.*
