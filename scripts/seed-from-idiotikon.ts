/**
 * Seed script: pull verified Mundart words from the Schweizerisches Idiotikon API
 * and build a word bank for Verbindige puzzles.
 *
 * Usage: npx tsx scripts/seed-from-idiotikon.ts
 *
 * This fetches real dialect words, their meanings, and produces a JSON word bank
 * that the puzzle editor can use to create daily puzzles.
 */

const BASE_URL = 'https://digital.idiotikon.ch/api';

interface Lemma {
  lemmaID: number;
  lemmaText: string;
  lemmaSimple: string;
  semEntryCount: number;
  url: string;
}

interface Meaning {
  semID: string;
  numLabelShort: string;
  semShortDescription: string;
  semDescription: string;
}

interface WordBankEntry {
  mundart_word: string;
  hochdeutsch: string;
  full_description: string;
  idiotikon_id: number;
  idiotikon_url: string;
  meanings_count: number;
}

// Curated search terms for categories useful in Verbindige puzzles
// Each search pulls real words from the Idiotikon
const SEARCH_TERMS = [
  // Body parts
  'Gring', 'Grind', 'Bire', 'Füdli', 'Hals', 'Buuch',
  // Food & drink
  'Rüebli', 'Härdöpfel', 'Kabis', 'Chäs', 'Brot', 'Znüni', 'Zvieri', 'Müesli',
  // Transport
  'Töffli', 'Velo', 'Tram', 'Postauto',
  // Insults / character
  'Löli', 'Tubel', 'Sürmel', 'Tschumpel', 'Chalb', 'Siech',
  // Weather
  'Bise', 'Föhn', 'Näbel', 'Schnee',
  // Daily life
  'Znacht', 'Zmorge', 'Stube', 'Chuchi', 'Bett',
  // Nature
  'Bach', 'Berg', 'Wald', 'Stein', 'Fluh',
  // Emotions / states
  'Heimweh', 'Freud', 'Müed', 'Wüetig',
];

async function searchLemmata(query: string): Promise<Lemma[]> {
  const res = await fetch(`${BASE_URL}/lemmata?query=${encodeURIComponent(query)}&limit=5`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

async function getMeanings(lemmaId: number): Promise<Meaning[]> {
  const res = await fetch(`${BASE_URL}/lemmata/${lemmaId}/meanings`);
  if (!res.ok) return [];
  return res.json();
}

function extractBestMeaning(meanings: Meaning[]): string {
  // Prefer short descriptions that are actual Hochdeutsch translations
  for (const m of meanings) {
    const desc = m.semShortDescription || m.semDescription;
    if (desc && desc.length > 0 && desc.length < 100) {
      return desc;
    }
  }
  return meanings[0]?.semShortDescription || '';
}

async function buildWordBank(): Promise<WordBankEntry[]> {
  const bank: WordBankEntry[] = [];
  let processed = 0;

  for (const term of SEARCH_TERMS) {
    try {
      const lemmata = await searchLemmata(term);

      for (const lemma of lemmata) {
        if (!lemma.isMainLemma) continue;

        const meanings = await getMeanings(lemma.lemmaID);
        const hochdeutsch = extractBestMeaning(meanings);

        if (hochdeutsch) {
          bank.push({
            mundart_word: lemma.lemmaText,
            hochdeutsch,
            full_description: meanings[0]?.semDescription || '',
            idiotikon_id: lemma.lemmaID,
            idiotikon_url: `https://digital.idiotikon.ch/p/lem/${lemma.lemmaID}`,
            meanings_count: lemma.semEntryCount,
          });
        }
      }

      processed++;
      if (processed % 10 === 0) {
        console.log(`Processed ${processed}/${SEARCH_TERMS.length} terms, ${bank.length} words found`);
      }

      // Be nice to the API
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.warn(`Failed to fetch "${term}":`, err);
    }
  }

  return bank;
}

async function main() {
  console.log('Fetching words from Schweizerisches Idiotikon API...');
  console.log(`Searching ${SEARCH_TERMS.length} curated terms\n`);

  const bank = await buildWordBank();

  // Deduplicate by lemmaID
  const unique = [...new Map(bank.map((w) => [w.idiotikon_id, w])).values()];

  console.log(`\nWord bank complete: ${unique.length} unique verified Mundart words`);
  console.log('Source: Schweizerisches Idiotikon (digital.idiotikon.ch)\n');

  // Write to file
  const fs = await import('fs');
  const outPath = './scripts/mundart-word-bank.json';
  fs.writeFileSync(outPath, JSON.stringify(unique, null, 2));
  console.log(`Written to ${outPath}`);

  // Print sample
  console.log('\nSample entries:');
  unique.slice(0, 10).forEach((w) => {
    console.log(`  ${w.mundart_word} → ${w.hochdeutsch} (${w.idiotikon_url})`);
  });
}

main().catch(console.error);
