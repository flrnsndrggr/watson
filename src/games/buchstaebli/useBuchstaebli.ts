import { create } from 'zustand';
import type { BuchstaebliPuzzle, Rank, StreakData } from '@/types';
import { SAMPLE_BUCHSTAEBLI, DEMO_VALID_WORDS } from './buchstaebli.data';
import { fetchTodaysPuzzle, fetchPuzzleByDate } from '@/lib/supabase';
import { recordGamePlayed, getStreak } from '@/lib/streaks';
import { submitLeaderboardEntry } from '@/lib/leaderboard';
import { trackGameStarted, trackGameCompleted, checkStreakMilestone } from '@/lib/analytics';

export interface FoundWord {
  word: string;
  is_pangram: boolean;
  is_mundart: boolean;
  points: number;
}

interface BuchstaebliState {
  puzzle: BuchstaebliPuzzle | null;
  currentInput: string;
  foundWords: FoundWord[];
  score: number;
  currentRank: Rank;
  outerLetters: string[];
  lastResult: 'valid' | 'pangram' | 'mundart' | 'already-found' | 'too-short' | 'not-valid' | 'missing-center' | null;
  status: 'playing' | 'complete';
  streak: StreakData;
  isArchive: boolean;

  loadPuzzle: (archiveDate?: string) => Promise<void>;
  addLetter: (letter: string) => void;
  deleteLetter: () => void;
  clearInput: () => void;
  shuffleLetters: () => void;
  submitWord: () => void;
  clearLastResult: () => void;
  finishGame: () => void;
}

function getRank(score: number, thresholds: BuchstaebliPuzzle['rank_thresholds']): Rank {
  if (score >= thresholds.bundesrat) return 'bundesrat';
  if (score >= thresholds.meister) return 'meister';
  if (score >= thresholds.geselle) return 'geselle';
  if (score >= thresholds.lehrling) return 'lehrling';
  return 'stift';
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const useBuchstaebli = create<BuchstaebliState>((set, get) => ({
  puzzle: null,
  currentInput: '',
  foundWords: [],
  score: 0,
  currentRank: 'stift',
  outerLetters: [],
  lastResult: null,
  status: 'playing',
  streak: getStreak('buchstaebli'),
  isArchive: false,

  loadPuzzle: async (archiveDate?: string) => {
    set({ isArchive: !!archiveDate });
    const fetched = archiveDate
      ? await fetchPuzzleByDate<BuchstaebliPuzzle>('buchstaebli', archiveDate)
      : await fetchTodaysPuzzle<BuchstaebliPuzzle>('buchstaebli');
    const puzzle = fetched ?? SAMPLE_BUCHSTAEBLI;
    set({
      puzzle,
      outerLetters: [...puzzle.outer_letters],
      currentInput: '',
      foundWords: [],
      score: 0,
      currentRank: 'stift',
      status: 'playing',
    });
    trackGameStarted('buchstaebli', !!archiveDate);
  },

  addLetter: (letter) => {
    set((s) => ({ currentInput: s.currentInput + letter.toUpperCase() }));
  },

  deleteLetter: () => {
    set((s) => ({ currentInput: s.currentInput.slice(0, -1) }));
  },

  clearInput: () => set({ currentInput: '' }),

  shuffleLetters: () => {
    set((s) => ({ outerLetters: shuffleArray(s.outerLetters) }));
  },

  clearLastResult: () => set({ lastResult: null }),

  submitWord: () => {
    const { currentInput, puzzle, foundWords, score } = get();
    if (!puzzle) return;

    const word = currentInput.toLowerCase();

    if (word.length < 4) {
      set({ lastResult: 'too-short', currentInput: '' });
      return;
    }

    if (!word.includes(puzzle.center_letter.toLowerCase())) {
      set({ lastResult: 'missing-center', currentInput: '' });
      return;
    }

    if (foundWords.some((fw) => fw.word === word)) {
      set({ lastResult: 'already-found', currentInput: '' });
      return;
    }

    // Demo: check against local word list. In production, this would be a server call.
    const result = DEMO_VALID_WORDS[word];
    if (!result) {
      set({ lastResult: 'not-valid', currentInput: '' });
      return;
    }

    const newFound: FoundWord = { word, ...result };
    const newScore = score + result.points;
    const newRank = getRank(newScore, puzzle.rank_thresholds);
    const newFoundWords = [...foundWords, newFound];

    // Record streak on first word found (skip for archive)
    const streakUpdate = foundWords.length === 0 && !get().isArchive
      ? (() => {
          const streak = recordGamePlayed('buchstaebli');
          checkStreakMilestone('buchstaebli', streak.current);
          return { streak };
        })()
      : {};

    // Auto-complete if all demo words found
    const allFound = Object.keys(DEMO_VALID_WORDS).every(
      (w) => newFoundWords.some((fw) => fw.word === w),
    );

    // Submit to leaderboard on each word found (upsert keeps latest score)
    if (!get().isArchive) {
      void submitLeaderboardEntry('buchstaebli', newScore, null);
    }

    if (allFound) {
      trackGameCompleted('buchstaebli', 'complete', get().isArchive, newScore);
    }

    set({
      foundWords: newFoundWords,
      score: newScore,
      currentRank: newRank,
      currentInput: '',
      lastResult: result.is_pangram ? 'pangram' : result.is_mundart ? 'mundart' : 'valid',
      ...(allFound ? { status: 'complete' as const } : {}),
      ...streakUpdate,
    });
  },

  finishGame: () => {
    trackGameCompleted('buchstaebli', 'complete', get().isArchive, get().score);
    set({ status: 'complete' });
  },
}));
