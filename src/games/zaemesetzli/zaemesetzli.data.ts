import type { ZaemesetzliPuzzle } from '@/types';

// Each emoji's `canonical_noun` plus any `alt_nouns` are advertised to the
// player in the EmojiPool tooltip — they are the *legitimate* meanings of
// that emoji. Keep alt_nouns to direct synonyms only. If you add a compound
// that needs an emoji to mean something the tooltip doesn't list, the
// compound becomes a "ghost" solution: visible in answers but unreachable
// during play. Either tighten the compound or extend alt_nouns — but only
// when the broader meaning is genuinely fair.
export const SAMPLE_ZAEMESETZLI: ZaemesetzliPuzzle = {
  id: 'z-001',
  date: '2026-04-16',
  emojis: [
    { emoji: '🏠', canonical_noun: 'Haus', alt_nouns: ['Gebäude', 'Heim'] },
    { emoji: '🔑', canonical_noun: 'Schlüssel', alt_nouns: [] },
    { emoji: '🌳', canonical_noun: 'Baum', alt_nouns: ['Holz'] },
    { emoji: '🍎', canonical_noun: 'Apfel', alt_nouns: ['Frucht'] },
    { emoji: '⛰️', canonical_noun: 'Berg', alt_nouns: ['Alp'] },
    { emoji: '🧀', canonical_noun: 'Käse', alt_nouns: [] },
    { emoji: '🔔', canonical_noun: 'Glocke', alt_nouns: [] },
    { emoji: '🐄', canonical_noun: 'Kuh', alt_nouns: [] },
    { emoji: '☀️', canonical_noun: 'Sonne', alt_nouns: ['Licht'] },
    { emoji: '🚪', canonical_noun: 'Tür', alt_nouns: [] },
  ],
  valid_compounds: [
    { word: 'Hausschlüssel', components: ['🏠', '🔑'], difficulty: 1, points: 1, is_mundart: false },
    { word: 'Haustür', components: ['🏠', '🚪'], difficulty: 1, points: 1, is_mundart: false },
    { word: 'Kuhglocke', components: ['🐄', '🔔'], difficulty: 1, points: 1, is_mundart: false },
    { word: 'Apfelbaum', components: ['🍎', '🌳'], difficulty: 1, points: 1, is_mundart: false },
    { word: 'Bergkäse', components: ['⛰️', '🧀'], difficulty: 1, points: 1, is_mundart: false },
    { word: 'Baumhaus', components: ['🌳', '🏠'], difficulty: 1, points: 1, is_mundart: false },
    { word: 'Türglocke', components: ['🚪', '🔔'], difficulty: 1, points: 1, is_mundart: false },
    { word: 'Käseglocke', components: ['🧀', '🔔'], difficulty: 2, points: 2, is_mundart: false },
    { word: 'Alpkäse', components: ['⛰️', '🧀'], difficulty: 2, points: 3, is_mundart: true },
    { word: 'Chäshüsli', components: ['🧀', '🏠'], difficulty: 3, points: 3, is_mundart: true },
  ],
  max_score: 15,
  rank_thresholds: {
    stift: 0,
    lehrling: 3,
    geselle: 7,
    meister: 11,
    bundesrat: 14,
  },
};

// Demo validation map (in production, server-side only)
export const DEMO_COMPOUND_MAP: Map<string, typeof SAMPLE_ZAEMESETZLI.valid_compounds[0]> = new Map(
  SAMPLE_ZAEMESETZLI.valid_compounds.map((c) => [c.word.toLowerCase(), c]),
);
