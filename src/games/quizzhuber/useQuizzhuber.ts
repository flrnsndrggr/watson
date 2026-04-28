import { create } from 'zustand';
import type { QuizzhuberPuzzle, StreakData } from '@/types';
import { SAMPLE_QUIZZHUBER } from './quizzhuber.data';
import { fetchTodaysPuzzle, fetchPuzzleByDate } from '@/lib/supabase';
import { getTodayDateCET } from '@/lib/dateUtils';
import { recordGamePlayed, getStreak } from '@/lib/streaks';
import { submitLeaderboardEntry } from '@/lib/leaderboard';
import { saveDailyResult } from '@/lib/dailyResults';
import { saveGameProgress, loadGameProgress, clearGameProgress } from '@/lib/gamePersistence';
import { triggerAccountPrompt } from '@/components/shared/AccountPromptHost';
import { checkAchievements } from '@/lib/achievements';

interface QuizzhuberState {
  puzzle: QuizzhuberPuzzle | null;
  currentIndex: number;
  /** Per-question selected option index, null if not yet answered. */
  answers: (number | null)[];
  startedAt: number | null;
  status: 'loading' | 'playing' | 'finished';
  isArchive: boolean;
  streak: StreakData;

  loadPuzzle: (archiveDate?: string) => Promise<void>;
  selectAnswer: (optionIndex: number) => void;
  next: () => void;
  finish: () => void;
}

interface QuizzhuberProgress {
  puzzleId: string;
  currentIndex: number;
  answers: (number | null)[];
  startedAt: number;
}

function persistQuizzhuber(state: QuizzhuberState): void {
  if (state.isArchive || !state.puzzle || state.status !== 'playing') return;
  saveGameProgress<QuizzhuberProgress>('quizzhuber', state.puzzle.id, {
    puzzleId: state.puzzle.id,
    currentIndex: state.currentIndex,
    answers: state.answers,
    startedAt: state.startedAt ?? Date.now(),
  });
}

function correctCount(puzzle: QuizzhuberPuzzle, answers: (number | null)[]): number {
  return puzzle.questions.reduce((sum, q, i) => {
    return sum + (answers[i] === q.correct_index ? 1 : 0);
  }, 0);
}

export const useQuizzhuber = create<QuizzhuberState>((set, get) => ({
  puzzle: null,
  currentIndex: 0,
  answers: [],
  startedAt: null,
  status: 'loading',
  isArchive: false,
  streak: getStreak('quizzhuber'),

  loadPuzzle: async (archiveDate?: string) => {
    set({ status: 'loading', isArchive: !!archiveDate });
    const fetched = archiveDate
      ? await fetchPuzzleByDate<QuizzhuberPuzzle>('quizzhuber', archiveDate)
      : await fetchTodaysPuzzle<QuizzhuberPuzzle>('quizzhuber');
    const fallbackDate = archiveDate ?? getTodayDateCET();
    const puzzle: QuizzhuberPuzzle = fetched ?? { ...SAMPLE_QUIZZHUBER, date: fallbackDate };

    if (!archiveDate) {
      const saved = loadGameProgress<QuizzhuberProgress>('quizzhuber', puzzle.id);
      if (saved && saved.answers.some((a) => a === null)) {
        set({
          puzzle,
          currentIndex: saved.currentIndex,
          answers: saved.answers,
          startedAt: saved.startedAt,
          status: 'playing',
        });
        return;
      }
    }

    clearGameProgress('quizzhuber');
    set({
      puzzle,
      currentIndex: 0,
      answers: Array(puzzle.questions.length).fill(null),
      startedAt: Date.now(),
      status: 'playing',
    });
  },

  selectAnswer: (optionIndex) => {
    const { puzzle, currentIndex, answers, isArchive } = get();
    if (!puzzle || answers[currentIndex] !== null) return;
    const next = [...answers];
    next[currentIndex] = optionIndex;
    set({ answers: next });
    if (!isArchive) persistQuizzhuber(get());
  },

  next: () => {
    const { puzzle, currentIndex, answers } = get();
    if (!puzzle) return;
    const isLast = currentIndex >= puzzle.questions.length - 1;
    if (isLast) {
      get().finish();
      return;
    }
    if (answers[currentIndex] === null) return;
    set({ currentIndex: currentIndex + 1 });
    if (!get().isArchive) persistQuizzhuber(get());
  },

  finish: () => {
    const { puzzle, answers, isArchive, startedAt } = get();
    if (!puzzle || get().status !== 'playing') return;
    const elapsed = startedAt ? Math.round((Date.now() - startedAt) / 1000) : null;
    const score = correctCount(puzzle, answers);

    if (!isArchive) {
      const streak = recordGamePlayed('quizzhuber');
      void submitLeaderboardEntry('quizzhuber', score, elapsed);
      triggerAccountPrompt(streak.current);
      setTimeout(() => { void checkAchievements(); }, 0);
      saveDailyResult('quizzhuber', {
        outcome: score >= puzzle.questions.length / 2 ? 'won' : 'lost',
        summary: `${score}/${puzzle.questions.length}`,
        timeSeconds: elapsed,
        perfect: score === puzzle.questions.length,
      });
      set({ streak });
    }

    clearGameProgress('quizzhuber');
    set({ status: 'finished' });
  },
}));
