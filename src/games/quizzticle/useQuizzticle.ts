import { create } from 'zustand';
import type { QuizzticlePuzzle, StreakData } from '@/types';
import { SAMPLE_QUIZZTICLE } from './quizzticle.data';
import { fetchTodaysPuzzle, fetchPuzzleByDate } from '@/lib/supabase';
import { getTodayDateCET } from '@/lib/dateUtils';
import { getStreak } from '@/lib/streaks';
import { saveGameProgress, loadGameProgress, clearGameProgress } from '@/lib/gamePersistence';
import { completeGame } from '@/lib/completeGame';
import { normalizeText } from '@/lib/textNormalization';

interface QuizzticleState {
  puzzle: QuizzticlePuzzle | null;
  /** Per-item flag: true if the player has filled the slot. Index aligns with puzzle.items. */
  filled: boolean[];
  /** Display value to render in each filled slot (the canonical answer). */
  filledDisplay: (string | null)[];
  /** Seconds remaining on the timer. */
  timeRemaining: number;
  startedAt: number | null;
  status: 'loading' | 'playing' | 'finished';
  isArchive: boolean;
  streak: StreakData;

  loadPuzzle: (archiveDate?: string) => Promise<void>;
  /** Returns true if the input matched any unfilled slot. */
  tryMatch: (input: string) => number | null;
  tickSecond: () => void;
  finish: () => void;
}

interface QuizzticleProgress {
  puzzleId: string;
  filled: boolean[];
  filledDisplay: (string | null)[];
  timeRemaining: number;
  startedAt: number;
}

function persistQuizzticle(state: QuizzticleState): void {
  if (state.isArchive || !state.puzzle || state.status !== 'playing') return;
  saveGameProgress<QuizzticleProgress>('quizzticle', state.puzzle.id, {
    puzzleId: state.puzzle.id,
    filled: state.filled,
    filledDisplay: state.filledDisplay,
    timeRemaining: state.timeRemaining,
    startedAt: state.startedAt ?? Date.now(),
  });
}

const normalize = (s: string) => normalizeText(s);

export const useQuizzticle = create<QuizzticleState>((set, get) => ({
  puzzle: null,
  filled: [],
  filledDisplay: [],
  timeRemaining: 0,
  startedAt: null,
  status: 'loading',
  isArchive: false,
  streak: getStreak('quizzticle'),

  loadPuzzle: async (archiveDate?: string) => {
    set({ status: 'loading', isArchive: !!archiveDate });
    const fetched = archiveDate
      ? await fetchPuzzleByDate<QuizzticlePuzzle>('quizzticle', archiveDate)
      : await fetchTodaysPuzzle<QuizzticlePuzzle>('quizzticle');
    const fallbackDate = archiveDate ?? getTodayDateCET();
    const puzzle: QuizzticlePuzzle = fetched ?? { ...SAMPLE_QUIZZTICLE, date: fallbackDate };

    if (!archiveDate) {
      const saved = loadGameProgress<QuizzticleProgress>('quizzticle', puzzle.id);
      if (saved && saved.timeRemaining > 0 && saved.filled.some((f) => !f)) {
        set({
          puzzle,
          filled: saved.filled,
          filledDisplay: saved.filledDisplay,
          timeRemaining: saved.timeRemaining,
          startedAt: saved.startedAt,
          status: 'playing',
        });
        return;
      }
    }

    clearGameProgress('quizzticle');
    set({
      puzzle,
      filled: puzzle.items.map(() => false),
      filledDisplay: puzzle.items.map(() => null),
      timeRemaining: puzzle.duration_seconds,
      startedAt: Date.now(),
      status: 'playing',
    });
  },

  tryMatch: (input) => {
    const { puzzle, filled, filledDisplay } = get();
    if (!puzzle) return null;
    const norm = normalize(input);
    if (norm.length < 2) return null;
    for (let i = 0; i < puzzle.items.length; i++) {
      if (filled[i]) continue;
      const matches = puzzle.items[i].accepted_answers.some(
        (a) => normalize(a) === norm,
      );
      if (matches) {
        const newFilled = [...filled];
        const newDisplay = [...filledDisplay];
        newFilled[i] = true;
        newDisplay[i] = puzzle.items[i].display;
        set({ filled: newFilled, filledDisplay: newDisplay });
        persistQuizzticle(get());
        // All filled? auto-finish
        if (newFilled.every((f) => f)) get().finish();
        return i;
      }
    }
    return null;
  },

  tickSecond: () => {
    const { timeRemaining, status } = get();
    if (status !== 'playing') return;
    if (timeRemaining <= 1) {
      set({ timeRemaining: 0 });
      get().finish();
      return;
    }
    set({ timeRemaining: timeRemaining - 1 });
    if ((timeRemaining - 1) % 10 === 0) persistQuizzticle(get());
  },

  finish: () => {
    const { puzzle, filled, isArchive, startedAt } = get();
    if (!puzzle || get().status !== 'playing') return;
    const score = filled.filter(Boolean).length;
    const elapsed = startedAt ? Math.round((Date.now() - startedAt) / 1000) : null;

    if (!isArchive) {
      const streak = completeGame({
        gameType: 'quizzticle',
        score,
        elapsed,
        dailyResult: {
          outcome: score === puzzle.items.length ? 'won' : 'lost',
          summary: `${score}/${puzzle.items.length}`,
          timeSeconds: elapsed,
          perfect: score === puzzle.items.length,
        },
      });
      set({ streak });
    }
    clearGameProgress('quizzticle');
    set({ status: 'finished' });
  },
}));
