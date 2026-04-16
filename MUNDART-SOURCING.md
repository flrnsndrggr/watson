# Mundart Word Sourcing — games.watson.ch

## Golden Rule

**No AI-generated Swiss German.** Every Mundart word in the games must trace back to the Schweizerisches Idiotikon or another verified linguistic source.

## Data Pipeline

```
Idiotikon API (digital.idiotikon.ch/api)
    ↓
scripts/seed-from-idiotikon.ts  →  mundart-word-bank.json (79+ verified words)
    ↓
Puzzle Editor (human) curates daily puzzles from word bank
    ↓
Supabase DB (puzzles stored with idiotikon_url reference)
    ↓
Games frontend (displays word, shows Hochdeutsch + region on solve)
```

## How It Works

### Idiotikon API (no auth, free)

- `GET /api/lemmata?query=Gring` → returns lemmata with IDs
- `GET /api/lemmata/{id}/meanings` → returns Hochdeutsch meanings, descriptions
- Every word has a citable `digital.idiotikon.ch/p/lem/{id}` URL

### Word Bank (scripts/mundart-word-bank.json)

Pre-fetched JSON with fields:
- `mundart_word` — the dialect spelling from Idiotikon
- `hochdeutsch` — Standard German meaning
- `idiotikon_id` / `idiotikon_url` — source attribution
- `full_description` — extended definition

### Puzzle Editor Workflow

1. Browse word bank JSON or search Idiotikon API directly
2. Select 16 words for Verbindige, assign to 4 groups
3. Add category labels (Hochdeutsch), region tags
4. Every word in the puzzle links back to its Idiotikon entry
5. Save to Supabase via CMS

### Expanding the Word Bank

```bash
# Run the seed script to pull more words
npx tsx scripts/seed-from-idiotikon.ts

# Add more search terms to SEARCH_TERMS array in the script
# The API has the full 17-volume dictionary — thousands of words available
```

## Sources

- **Primary:** Schweizerisches Idiotikon — https://digital.idiotikon.ch
- **Secondary:** ArchiMob corpus (CC-BY-NC-SA) — spoken Swiss German transcriptions
- **Secondary:** NOAH Corpus — POS-tagged Swiss German text
- **Never:** AI-generated Mundart, user-submitted unverified words, or vibes-based dialect
