import { create } from 'zustand';
import type { SchlaglochPuzzle, StreakData, LeaderboardGameType } from '@/types';
import { SAMPLE_SCHLAGLOCH, DEMO_ANSWERS, DEMO_DISPLAY_ANSWERS } from './schlagloch.data';
import { fetchTodaysPuzzle, fetchPuzzleByDate, getTodayDateCET } from '@/lib/supabase';
import { recordGamePlayed, getStreak } from '@/lib/streaks';
import { submitLeaderboardEntry } from '@/lib/leaderboard';
import { trackGameStarted, trackGameCompleted, checkStreakMilestone, trackSchlaglochHeadlineGuess } from '@/lib/analytics';
import { saveDailyResult } from '@/lib/dailyResults';
import { saveGameProgress, loadGameProgress, clearGameProgress } from '@/lib/gamePersistence';

/** Standard Schlagloch has 5 headlines; Rückblick (Sunday) has more. */
const STANDARD_HEADLINE_COUNT = 5;
const STANDARD_MAX_ERRORS = 3;
const RUECKBLICK_MAX_ERRORS = 5;

interface SchlaglochPuzzleWithAnswers extends SchlaglochPuzzle {
  answers?: string[][];
  display_answers?: string[];
}

interface SchlaglochState {
  puzzle: SchlaglochPuzzle | null;
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
  streak: StreakData;
  isArchive: boolean;
  isRueckblick: boolean;
  startedAt: number | null;
  elapsedSeconds: number | null;

  loadPuzzle: (archiveDate?: string) => Promise<void>;
  submitGuess: (guess: string) => void;
  advanceToNext: () => void;
  useHint: (index: number) => void;
  clearLastResult: () => void;
}

interface SchlaglochProgress {
  currentIndex: number;
  totalErrors: number;
  results: ('correct' | 'wrong' | null)[];
  revealedAnswers: (string | null)[];
  hintsUsed: boolean[];
  startedAt: number | null;
}

function getLeaderboardType(state: SchlaglochState): LeaderboardGameType {
  return state.isRueckblick ? 'schlagloch_rueckblick' : 'schlagloch';
}

function persistSchlagloch(state: SchlaglochState): void {
  if (state.isArchive || !state.puzzle || state.status !== 'playing') return;
  saveGameProgress<SchlaglochProgress>('schlagloch', state.puzzle.id, {
    currentIndex: state.currentIndex,
    totalErrors: state.totalErrors,
    results: state.results,
    revealedAnswers: state.revealedAnswers,
    hintsUsed: state.hintsUsed,
    startedAt: state.startedAt,
  });
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

export const useSchlagloch = create<SchlaglochState>((set, get) => ({
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
  streak: getStreak('schlagloch'),
  isArchive: false,
  isRueckblick: false,
  startedAt: null,
  elapsedSeconds: null,

  loadPuzzle: async (archiveDate?: string) => {
    set({ status: 'loading', isArchive: !!archiveDate });
    const fetched = archiveDate
      ? await fetchPuzzleByDate<SchlaglochPuzzleWithAnswers>('schlagloch', archiveDate)
      : await fetchTodaysPuzzle<SchlaglochPuzzleWithAnswers>('schlagloch');
    const fallbackDate = archiveDate ?? getTodayDateCET();
    const puzzle: SchlaglochPuzzle = fetched ?? { ...SAMPLE_SCHLAGLOCH, date: fallbackDate };
    const answers = fetched?.answers ?? DEMO_ANSWERS;
    const displayAnswers = fetched?.display_answers ?? DEMO_DISPLAY_ANSWERS;
    const isRueckblick = puzzle.headlines.length > STANDARD_HEADLINE_COUNT;
    const maxErrors = isRueckblick ? RUECKBLICK_MAX_ERRORS : STANDARD_MAX_ERRORS;

    // Restore in-progress state for today's puzzle
    if (!archiveDate) {
      const saved = loadGameProgress<SchlaglochProgress>('schlagloch', puzzle.id);
      if (saved && saved.results.some((r) => r === null)) {
        set({
          puzzle,
          answers,
          displayAnswers,
          currentIndex: saved.currentIndex,
          totalErrors: saved.totalErrors,
          maxErrors,
          results: saved.results,
          revealedAnswers: saved.revealedAnswers,
          hintsUsed: saved.hintsUsed,
          startedAt: saved.startedAt,
          status: 'playing',
          lastGuessResult: null,
          elapsedSeconds: null,
          isRueckblick,
        });
        trackGameStarted('schlagloch', false);
        return;
      }
    }

    clearGameProgress('schlagloch');
    set({
      puzzle,
      answers,
      displayAnswers,
      currentIndex: 0,
      totalErrors: 0,
      maxErrors,
      results: Array(puzzle.headlines.length).fill(null),
      revealedAnswers: Array(puzzle.headlines.length).fill(null),
      hintsUsed: Array(puzzle.headlines.length).fill(false),
      status: 'playing',
      startedAt: Date.now(),
      elapsedSeconds: null,
      isRueckblick,
    });
    trackGameStarted('schlagloch', !!archiveDate);
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
      const headline = get().puzzle?.headlines[currentIndex];
      if (headline) {
        trackSchlaglochHeadlineGuess('correct', currentIndex, headline.difficulty, get().hintsUsed[currentIndex]);
      }
      set({ results: newResults, revealedAnswers: newRevealed, lastGuessResult: 'correct' });
      persistSchlagloch(get());
    } else {
      const headline = get().puzzle?.headlines[currentIndex];
      if (headline) {
        trackSchlaglochHeadlineGuess('wrong', currentIndex, headline.difficulty, get().hintsUsed[currentIndex]);
      }
      const newErrors = totalErrors + 1;
      if (newErrors >= maxErrors) {
        for (let i = currentIndex; i < newResults.length; i++) {
          if (newResults[i] === null) {
            newResults[i] = 'wrong';
            newRevealed[i] = displayAnswers[i] ?? allAnswers[i]?.[0] ?? '';
          }
        }
        const correctCount = newResults.filter((r) => r === 'correct').length;
        const elapsed = get().startedAt ? Math.round((Date.now() - get().startedAt!) / 1000) : null;
        if (!get().isArchive) {
          void submitLeaderboardEntry(getLeaderboardType(get()), correctCount, elapsed);
        }
        const streakUpdate = get().isArchive ? {} : (() => {
          const streak = recordGamePlayed('schlagloch');
          checkStreakMilestone('schlagloch', streak.current);
          return { streak };
        })();
        trackGameCompleted('schlagloch', 'lost', get().isArchive, correctCount, elapsed);
        if (!get().isArchive) {
          const emojiLine = newResults.map((r) => r === 'correct' ? '\u{1F7E9}' : '\u{1F7E5}').join('');
          saveDailyResult('schlagloch', {
            outcome: 'lost',
            summary: `${correctCount}/${newResults.length}`,
            emojiLine,
            timeSeconds: elapsed,
          });
        }
        clearGameProgress('schlagloch');
        set({
          totalErrors: newErrors,
          results: newResults,
          revealedAnswers: newRevealed,
          status: 'finished',
          lastGuessResult: 'wrong',
          elapsedSeconds: elapsed,
          ...streakUpdate,
        });
      } else {
        set({ totalErrors: newErrors, lastGuessResult: 'wrong' });
        persistSchlagloch(get());
      }
    }
  },

  advanceToNext: () => {
    const { currentIndex, puzzle, results } = get();
    if (!puzzle) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= puzzle.headlines.length || results.every((r) => r !== null)) {
      const correctCount = results.filter((r) => r === 'correct').length;
      const elapsed = get().startedAt ? Math.round((Date.now() - get().startedAt!) / 1000) : null;
      if (!get().isArchive) {
        void submitLeaderboardEntry(getLeaderboardType(get()), correctCount, elapsed);
      }
      const streakUpdate2 = get().isArchive ? {} : (() => {
          const streak = recordGamePlayed('schlagloch');
          checkStreakMilestone('schlagloch', streak.current);
          return { streak };
        })();
      trackGameCompleted('schlagloch', 'won', get().isArchive, correctCount, elapsed);
      if (!get().isArchive) {
        const emojiLine = results.map((r) => r === 'correct' ? '\u{1F7E9}' : '\u{1F7E5}').join('');
        saveDailyResult('schlagloch', {
          outcome: 'won',
          summary: `${correctCount}/${puzzle.headlines.length}`,
          emojiLine,
          timeSeconds: elapsed,
        });
      }
      clearGameProgress('schlagloch');
      set({ status: 'finished', elapsedSeconds: elapsed, ...streakUpdate2 });
    } else {
      set({ currentIndex: nextIndex, lastGuessResult: null });
      persistSchlagloch(get());
    }
  },

  clearLastResult: () => set({ lastGuessResult: null }),
}));
