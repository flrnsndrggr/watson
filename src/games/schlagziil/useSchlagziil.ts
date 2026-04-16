import { create } from 'zustand';
import type { SchlagziilPuzzle } from '@/types';
import { SAMPLE_SCHLAGZIIL, DEMO_ANSWERS } from './schlagziil.data';

interface SchlagziilState {
  puzzle: SchlagziilPuzzle | null;
  currentIndex: number;
  totalErrors: number;
  maxErrors: number;
  results: ('correct' | 'wrong' | null)[];
  revealedAnswers: (string | null)[];
  hintsUsed: boolean[];
  status: 'loading' | 'playing' | 'finished';
  lastGuessResult: 'correct' | 'wrong' | null;

  loadPuzzle: () => void;
  submitGuess: (guess: string) => void;
  advanceToNext: () => void;
  useHint: (index: number) => void;
  clearLastResult: () => void;
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[-\s]+/g, '');
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[m][n];
}

export const useSchlagziil = create<SchlagziilState>((set, get) => ({
  puzzle: null,
  currentIndex: 0,
  totalErrors: 0,
  maxErrors: 3,
  results: [],
  revealedAnswers: [],
  hintsUsed: [],
  status: 'loading',
  lastGuessResult: null,

  loadPuzzle: () => {
    const puzzle = SAMPLE_SCHLAGZIIL;
    set({
      puzzle,
      currentIndex: 0,
      totalErrors: 0,
      results: Array(puzzle.headlines.length).fill(null),
      revealedAnswers: Array(puzzle.headlines.length).fill(null),
      hintsUsed: Array(puzzle.headlines.length).fill(false),
      status: 'playing',
    });
  },

  useHint: (index: number) => {
    const { hintsUsed } = get();
    const newHints = [...hintsUsed];
    newHints[index] = true;
    set({ hintsUsed: newHints });
  },

  submitGuess: (guess: string) => {
    const { currentIndex, totalErrors, maxErrors, results, revealedAnswers } = get();
    const answers = DEMO_ANSWERS[currentIndex];
    if (!answers) return;

    const normalizedGuess = normalize(guess);
    const isCorrect = answers.some((answer) => {
      const normalizedAnswer = normalize(answer);
      if (normalizedAnswer === normalizedGuess) return true;
      if (guess.trim().toLowerCase() === answer.toLowerCase()) return true;
      if (answer.length > 5 && levenshtein(normalizedAnswer, normalizedGuess) <= 1) return true;
      return false;
    });

    const newResults = [...results];
    const newRevealed = [...revealedAnswers];

    if (isCorrect) {
      newResults[currentIndex] = 'correct';
      newRevealed[currentIndex] = answers[0];
      set({ results: newResults, revealedAnswers: newRevealed, lastGuessResult: 'correct' });
    } else {
      const newErrors = totalErrors + 1;
      if (newErrors >= maxErrors) {
        for (let i = currentIndex; i < newResults.length; i++) {
          if (newResults[i] === null) {
            newResults[i] = 'wrong';
            newRevealed[i] = DEMO_ANSWERS[i]?.[0] ?? '';
          }
        }
        set({
          totalErrors: newErrors,
          results: newResults,
          revealedAnswers: newRevealed,
          status: 'finished',
          lastGuessResult: 'wrong',
        });
      } else {
        set({ totalErrors: newErrors, lastGuessResult: 'wrong' });
      }
    }
  },

  advanceToNext: () => {
    const { currentIndex, puzzle, results } = get();
    if (!puzzle) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= puzzle.headlines.length || results.every((r) => r !== null)) {
      set({ status: 'finished' });
    } else {
      set({ currentIndex: nextIndex, lastGuessResult: null });
    }
  },

  clearLastResult: () => set({ lastGuessResult: null }),
}));
