# Changelog

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
