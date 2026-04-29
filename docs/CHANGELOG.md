# Changelog

## 2026-04-29

### Features
- Editor CMS for all six games — schedule view, per-format forms, edge function (`df4c5b5`)
- Rename Quizzhuber display label to "Quizz den Huber"; expand puzzle agent to all six games (`5ffe853`)

### Fixes
- Show Verbindige result screen on reload after win/loss (`02f6d91`)
- Replace stale Wikimedia thumbnail URLs in Aufgedeckt (`60f876f`)
- Force light mode until proper dark-mode pass (`870cc4f`)
- List all six games in Profil (Quizzhuber, Aufgedeckt, Quizzticle were missing) (`5125fd1`)
- Lock Verbindige back to Mundart Connections / Idiotikon-only (`390fe31`)
- Clean up React-Compiler-flagged setState-in-effect patterns (`086876e`)

### Polish
- Lost-game share shows gray ⬛ for auto-revealed Verbindige groups (`7b3ec76`)

## 2026-04-28

### Features
- Three new recurring formats — Quizzhuber, Aufgedeckt, Quizzticle (`7a8fd69`)
- Gamification phase 0: leaderboard, events, streaks server sync (`6d10f80`)
- Gamification phase 1.1+1.2: at-risk streak indicator + Eis-Tag freeze (`36cd433`)
- Gamification phase 1.3: account prompt at day-3 threshold (`6b0706a`)
- Gamification phase 2: achievements with 11 launch badges (`747c318`)
- Gamification phase 3: period leaderboards (Heute / Woche / Monat / Allzeit) (`2045bc7`)
- Gamification phase 4: web push subscriptions, account-agnostic (`a18a44f`)
- Tap-to-toggle emoji selection and slot removal in Zämesetzli (`608dcc3`)
- Code-split per game with lazy-load and dependency isolation (`f744242`)
- Close out cross-game polish checklist (`0bde57a`)
- Rebrand scheduler fleet dashboard with watson palette (`c5052f8`)

### Fixes
- Show toast on `navigator.share` success path (`8954b55`)
- Move toast from `top-[100px]` to `top-[60px]` to avoid covering emoji pool (`91dcd07`)
- `useAnimatedScore` tracks actual display value to prevent stale counter (`bac2066`)
- Schlagloch: derive answers + display answers from headline rows (`39022a9`)
- Bump service worker cache to v3 for supabase fetch fix (`9a5023d`)
- Join game tables on `id`, not `puzzle_id` (`3239591`)

### Polish
- Animate score counter and pop effect in RankBar (`fffb04f`)
- Tighten visual fidelity to watson.ch chrome (`95539b1`)

### Content
- Rename Eis-Tag → Joker (less Duolingo, more quiz-show) (`99f5744`)

### Performance
- Stub unused Supabase modules — vendor-supabase 48.53KB → 27.09KB gzip (`0e762bc`)

## 2026-04-21

### Features
- PWA service worker for offline play (`964c565`)
- Sunday Schlagziil Rückblick: 10 headlines, harder difficulty, separate leaderboard (`7397f4a`)
- Branded Verbindige editions CMS for sponsor-themed puzzles (`4485938`)
- Zämesetzli emoji-only submission (drop typing) (`3b35f98`)
- Schlagziil answer fills into headline blank with smooth card transitions (`b62400b`)
- StatsPanel and StoryShareButton for Schlagziil results (`863f436`)
- Difficulty-aware compound progress for Zämesetzli (`96dc3e4`)
- Mobile nav with scroll fade indicators and 44px touch targets (`db0d3b6`)
- Zämesetzli emoji hint glow and productive-emoji guidance (`dcee2a0`)
- watson-puzzle-content scheduler maintains 7-day rolling buffer (`221dbeb`)

### Fixes
- Show numeric score alongside rank in RankBar (`d796375`)
- Remove autoFocus on mobile to prevent keyboard covering headline (`07cc10a`)
- Render umlaut directly — JSX text does not interpret `\u` escapes (`fbe4508`)
- Bump service worker cache version for new shell (`74ef604`)
- Persist Neues-Raetsel banner dismissal across navigation (`de723a5`)

### Polish
- Gentle bounce-back animation on invalid Zämesetzli compounds (`c86c77f`)
- Subtle hint glow on combinable Zämesetzli emojis (`2e5774f`)
- Verbindige watson-ified — colors, typography, layout, microcopy (`a94652e`)

### Content
- Tighten emoji meanings, drop ghost compounds in Zämesetzli (`f109690`)

### Rename
- Schlagziil → Schlagloch (`501479e`)

## 2026-04-20

### Features
- Personalized daily dashboard landing page (`36403f6`)
- Sponsor bar above game area (`a00c0ee`)
- Pre-game interstitial ad: 5s countdown, once per session, mobile only (`a027899`)
- MREC 300x250 ad slot in post-game results screen (`c86320c`)
- Analytics event tracking for all games (`141ecb7`)
- Game-specific analytics events (`3bb6cd7`)
- Visual share card generation for all games (`f9fb599`)
- Daily sweep celebration + combined share card on landing page (`84370e2`)
- Schlagziil correct answer celebration animations (`2886174`)
- PostGameSection as daily-progress-aware engagement driver (`c757ab2`)
- Persist in-progress game state across page refreshes (`7ecadb8`)
- "Ich bi fertig" finish button for Zämesetzli (`058683e`)
- Duplicate guess prevention and toast feedback in Verbindige (`49f6fe5`)

### Fixes
- ARIA labels on interactive elements across all games (`77b21d5`)
- Keyboard navigation for Verbindige and Zämesetzli (`72ed260`)
- Add missing `alt_nouns` for phonetic emoji readings (`bd70b29`)
- Correct production URL in share text (`70a1ab9`)
- Toast feedback on share + clipboard error handling (`55b6ca0`)
- Repeated same-result feedback in Zämesetzli (`92e588a`)
- Screen reader space in GameHeader (`0e8e7fa`)
- Add missing `@supabase/supabase-js` dependency (`f4d133f`)

### Polish
- Custom 404 page with link back to landing (`9e4196f`)
- Improved ShareButton feedback for Web Share API vs clipboard (`50d5059`)
- Tile selection animation complete (`da1c539`)

## 2026-04-19

### Features
- Wrong-answer shake feedback for Schlagloch headline cards (`87dbe18`)
- Persist game completion state in localStorage — prevent replaying same puzzle (`789b993`)
- User accounts with Supabase Auth magic link sign-in (`dfe2fa9`)
- Premium Verbindige results screen with performance tiers and animations (`0cd5e55`)
- Finalize share card formats — Schlagloch accuracy grid + CTA (`6f5e768`)
- Add game feel to Zämesetzli — shake, confetti, rank celebrations (`ed06b94`)
- Add game feel to Schlagloch — shake, toasts, confetti (`17bc2ed`)

### Fixes
- Standardize puzzle identifier across header, result, and share text (`31bc00d`)
- Display proper German strings for revealed Schlagloch answers (`1a2835f`)

### Polish
- Add subtle pulse animation to ErrorDots on latest filled dot (`a7859cd`)
- AdSlot placeholder with dashed border and "Anzeige" label (`41077ee`)
- Improve ShareButton Web Share API integration (`5bb45e4`)
- Add streak counter display to GameHeader (`a487c03`)
- Respect `prefers-reduced-motion` — disable confetti, kill transforms (`9ff71ec`)

### Performance
- Replace full Supabase SDK with postgrest-js — 51.85KB → 7.77KB gzipped (`2b906a3`)
- Defer Supabase SDK from critical path — entry 60.95KB → 3.65KB gzipped (`353c9f7`)

## 2026-04-18

### Features
- Add Verbindige shuffle button with staggered tile animation (`b51764b`)
- Add daily puzzle reset with midnight CET rollover detection (`1c851cb`)
- Supabase puzzle fetch with fallback to sample data (`d1250ae`)
- Rank-up celebrations with threshold markers on progress bar (`6580a97`)
- Remove Buchstäbli game entirely (`6fa24b7`)

### Fixes
- Correct max_score from 28 to 29 in Zämesetzli puzzle data (`e862f18`)
- Add key prop to HeadlineCard to reset hint state between headlines (`29f7061`)
- Render rank threshold tick marks on RankBar progress bar (`b20c579`)

### Polish
- Fix share text format — add Buchstäbli label/emoji, use puzzle dates (`5dc83f1`)
- Cap toast stack at 3 visible toasts (`16fc3a5`)

### CI
- Auto-deploy to Netlify on push to main (`8bd0acd`)

## 2026-04-16

### Features
- Add admin panel with auth, Idiotikon sourcing docs and scripts (`f7b97e4`)
- Add PostGameSection cross-promo and Buchstäbli landing card (`d5b7728`)
- Add /buchstaebli route to App.tsx (`298815a`)

### Fixes
- Add /buchstaebli route and landing page card (P0) (`d2de0ca`)
- Remove invalid demo words from buchstaebli.data.ts (`87f8b54`)
- Shake animation and one-away toast in Verbindige (`a6c3cd8`)

### Polish
- Toast auto-dismiss after 3s with fade-out animation (`baec496`)

### Performance
- Lazy-load all route components — 90.34KB → 59.53KB gzipped (`cb38a7b`)

### Docs
- Add agent operating contract, roadmap, and backlogs (`1729e42`)

### Init
- Initial games-watson project scaffolding (`91d0e17`)
