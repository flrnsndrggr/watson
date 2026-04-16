import type { BuchstaebliPuzzle } from '@/types';

export const SAMPLE_BUCHSTAEBLI: BuchstaebliPuzzle = {
  id: 'b-001',
  date: '2026-04-16',
  center_letter: 'A',
  outer_letters: ['R', 'E', 'T', 'N', 'S', 'L'],
  max_score: 112,
  rank_thresholds: {
    stift: 0,
    lehrling: 22,
    geselle: 45,
    meister: 78,
    bundesrat: 101,
  },
};

// For demo purposes: valid words for this puzzle
// In production, validation happens server-side
export const DEMO_VALID_WORDS: Record<string, { is_pangram: boolean; is_mundart: boolean; points: number }> = {
  'raten': { is_pangram: false, is_mundart: false, points: 5 },
  'raste': { is_pangram: false, is_mundart: false, points: 5 },
  'laterne': { is_pangram: false, is_mundart: false, points: 7 },
  'laster': { is_pangram: false, is_mundart: false, points: 6 },
  'ateral': { is_pangram: false, is_mundart: false, points: 7 },
  'trans': { is_pangram: false, is_mundart: false, points: 5 },
  'taler': { is_pangram: false, is_mundart: false, points: 5 },
  'alter': { is_pangram: false, is_mundart: false, points: 5 },
  'altern': { is_pangram: false, is_mundart: false, points: 6 },
  'anlass': { is_pangram: false, is_mundart: false, points: 6 },
  'atlas': { is_pangram: false, is_mundart: false, points: 5 },
  'arena': { is_pangram: false, is_mundart: false, points: 5 },
  'alert': { is_pangram: false, is_mundart: false, points: 5 },
  'stall': { is_pangram: false, is_mundart: false, points: 5 },
  'narr': { is_pangram: false, is_mundart: false, points: 1 },
  'least': { is_pangram: false, is_mundart: false, points: 5 },
  'sterntal': { is_pangram: true, is_mundart: false, points: 15 },
  'natel': { is_pangram: false, is_mundart: true, points: 10 },
};
