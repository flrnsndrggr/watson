import { create } from 'zustand';
import type { SchlagziilPuzzle } from '@/types';
import { SAMPLE_SCHLAGZIIL, DEMO_ANSWERS, DEMO_DISPLAY_ANSWERS } from './schlagziil.data';
import { fetchTodaysPuzzle } from '@/lib/supabase';
import { saveGameState, loadGameState } from '@/lib/gameStorage';

interface SchlagziilPuzzleWithAnswers extends SchlagziilPuzzle {
  answers?: string[][];
}

interface SchlagziilSavedState {
  results: ('correct' | 'wrong' | null)[];
  revealedAnswers: (string | null)[];
  totalErrors: number;
  hintsUsed: boolean[];
}

interface SchlagziilState {
  puzzle: SchlagziilPuzzle | null;
  answers: string[][];
  displayAnswers: string[];
  currentIndex: number;
  totalErrors: number;
  maxErrors: number;
  results: ('correct' | 'wrong' | null)[];
  revealedAnswers: (string | null)[];
  hintsUsed: boolean[];
  status: 'loading' | 'playing' | 'finished';
  lastGuessResult: 'correct' | 'wrong' | null;

  loadPuzzle: () => Promise<void>;
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
  answers: [],
  displayAnswers: [],
  currentIndex: 0,
  totalErrors: 0,
  maxErrors: 3,
  results: [],
  revealedAnswers: [],
  hintsUsed: [],
  status: 'loading',
  lastGuessResult: null,

  loadPuzzle: async () => {
    set({ status: 'loading' });
    const fetched = await fetchTodaysPuzzle<SchlagziilPuzzleWithAnswers>('schlagziil');
    const puzzle: SchlagziilPuzzle = fetched ?? SAMPLE_SCHLAGZIIL;
    const answers = fetched?.answers ?? DEMO_ANSWERS;
    const displayAnswers = (fetched as SchlagziilPuzzleWithAnswers & { display_answers?: string[] })?.display_answers ?? DEMO_DISPLAY_ANSWERS;

    // Restore completed state if already played today
    const saved = loadGameState<SchlagziilSavedState>('schlagziil', puzzle.date);
    if (saved && saved.results.every((r) => r !== null)) {
      set({
        puzzle,
        answers,
        displayAnswers,
        currentIndex: puzzle.headlines.length - 1,
        totalErrors: saved.totalErrors,
        results: saved.results,
        revealedAnswers: saved.revealedAnswers,
        hintsUsed: saved.hintsUsed,
        status: 'finished',
      });
      return;
    }

    set({
      puzzle,
      answers,
      displayAnswers,
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
    const { currentIndex, totalErrors, maxErrors, results, revealedAnswers, answers: allAnswers, displayAnswers } = get();
    const answers = allAnswers[currentIndex];
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
      newRevealed[currentIndex] = displayAnswers[currentIndex] ?? answers[0];
      set({ results: newResults, revealedAnswers: newRevealed, lastGuessResult: 'correct' });
    } else {
      const newErrors = totalErrors + 1;
      if (newErrors >= maxErrors) {
        for (let i = currentIndex; i < newResults.length; i++) {
          if (newResults[i] === null) {
            newResults[i] = 'wrong';
            newRevealed[i] = displayAnswers[i] ?? allAnswers[i]?.[0] ?? '';
          }
        }
        set({
          totalErrors: newErrors,
          results: newResults,
          revealedAnswers: newRevealed,
          status: 'finished',
          lastGuessResult: 'wrong',
        });
        const { puzzle } = get();
        if (puzzle) {
          saveGameState<SchlagziilSavedState>('schlagziil', puzzle.date, {
            results: newResults,
            revealedAnswers: newRevealed,
            totalErrors: newErrors,
            hintsUsed: get().hintsUsed,
          });
        }
      } else {
        set({ totalErrors: newErrors, lastGuessResult: 'wrong' });
      }
    }
  },

  advanceToNext: () => {
    const { currentIndex, puzzle, results, totalErrors, revealedAnswers, hintsUsed } = get();
    if (!puzzle) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= puzzle.headlines.length || results.every((r) => r !== null)) {
      set({ status: 'finished' });
      saveGameState<SchlagziilSavedState>('schlagziil', puzzle.date, {
        results,
        revealedAnswers,
        totalErrors,
        hintsUsed,
      });
    } else {
      set({ currentIndex: nextIndex, lastGuessResult: null });
    }
  },

  clearLastResult: () => set({ lastGuessResult: null }),
}));
