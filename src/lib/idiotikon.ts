/**
 * Schweizerisches Idiotikon API client
 * https://digital.idiotikon.ch/api/docs/
 *
 * The authoritative dictionary of Swiss German dialects.
 * All Mundart words in games.watson.ch should originate from this source.
 */

const BASE_URL = 'https://digital.idiotikon.ch/api';

export interface IdioLemma {
  lemmaID: number;
  indexEntry: string;
  lemmaText: string;
  lemmaSimple: string;
  isMainLemma: boolean;
  mainLemmaID: number;
  vol: number;
  col: number;
  semEntryCount: number;
  url: string;
}

export interface IdioMeaning {
  lemmaIndexEntry: string;
  lemmaID: string;
  semID: string;
  numLabel: string;
  numLabelShort: string;
  semDescription: string;
  semShortDescription: string;
  vol: number;
  col: number;
}

interface LemmataResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: IdioLemma[];
}

/**
 * Search for Swiss German words in the Idiotikon.
 * Returns verified dialect lemmata.
 */
export async function searchLemmata(
  query: string,
  limit = 20,
  offset = 0,
): Promise<LemmataResponse> {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`${BASE_URL}/lemmata?${params}`);
  if (!res.ok) throw new Error(`Idiotikon API error: ${res.status}`);
  return res.json();
}

/**
 * Get a specific lemma by ID.
 */
export async function getLemma(id: number): Promise<IdioLemma> {
  const res = await fetch(`${BASE_URL}/lemmata/${id}`);
  if (!res.ok) throw new Error(`Idiotikon API error: ${res.status}`);
  return res.json();
}

/**
 * Get all meanings for a lemma.
 * Use semShortDescription for Hochdeutsch translations.
 */
export async function getMeanings(lemmaId: number): Promise<IdioMeaning[]> {
  const res = await fetch(`${BASE_URL}/lemmata/${lemmaId}/meanings`);
  if (!res.ok) throw new Error(`Idiotikon API error: ${res.status}`);
  return res.json();
}

/**
 * Build a reference URL for a lemma (links to the full dictionary entry).
 */
export function getLemmaUrl(lemmaId: number): string {
  return `https://digital.idiotikon.ch/p/lem/${lemmaId}`;
}
