import { create } from 'zustand';
import type { SchlaglochPuzzle, StreakData, LeaderboardGameType } from '@/types';
import { SAMPLE_SCHLAGLOCH, DEMO_ANSWERS, DEMO_DISPLAY_ANSWERS } from './schlagloch.data';
import { fetchTodaysPuzzle, fetchPuzzleByDate } from '@/lib/supabase';
import { getTodayDateCET } from '@/lib/dateUtils';
import { getStreak } from '@/lib/streaks';
import { trackGameStarted, trackGameCompleted, trackSchlaglochHeadlineGuess } from '@/lib/analytics';
import { saveGameProgress, loadGameProgress, clearGameProgress } from '@/lib/gamePersistence';
import { completeGame } from '@/lib/completeGame';
import { normalizeText, levenshtein } from '@/lib/textNormalization';

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

const normalize = (s: string) => normalizeText(s, 'german');

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
    // Each fetched headline carries its own `accepted_answers` + `blanked_word`
    // — derive the per-headline arrays from those rather than expecting
    // top-level `answers` / `display_answers` fields (which the DB schema
    // doesn't have). Fall back to DEMO_* only when no remote puzzle was
    // returned at all (offline / RLS / network).
    const headlines = puzzle.headlines as Array<{
      accepted_answers?: string[];
      blanked_word?: string;
    }>;
    const fromHeadlines =
      Array.isArray(headlines) &&
      headlines.length > 0 &&
      headlines.every((h) => Array.isArray(h.accepted_answers) && h.blanked_word);
    const answers = fromHeadlines
      ? headlines.map((h) => h.accepted_answers!)
      : (fetched?.answers ?? DEMO_ANSWERS);
    const displayAnswers = fromHeadlines
      ? headlines.map((h) => h.blanked_word!)
      : (fetched?.display_answers ?? DEMO_DISPLAY_ANSWERS);
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
        const streakUpdate = get().isArchive ? {} : (() => {
          const emojiLine = newResults.map((r) => r === 'correct' ? '\u{1F7E9}' : '\u{1F7E5}').join('');
          const streak = completeGame({
            gameType: 'schlagloch',
            leaderboardType: getLeaderboardType(get()),
            score: correctCount,
            elapsed,
            dailyResult: {
              outcome: 'lost',
              summary: `${correctCount}/${newResults.length}`,
              emojiLine,
              timeSeconds: elapsed,
            },
          });
          return { streak };
        })();
        trackGameCompleted('schlagloch', 'lost', get().isArchive, correctCount, elapsed);
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
      const streakUpdate2 = get().isArchive ? {} : (() => {
          const emojiLine = results.map((r) => r === 'correct' ? '\u{1F7E9}' : '\u{1F7E5}').join('');
          const streak = completeGame({
            gameType: 'schlagloch',
            leaderboardType: getLeaderboardType(get()),
            score: correctCount,
            elapsed,
            dailyResult: {
              outcome: 'won',
              summary: `${correctCount}/${puzzle.headlines.length}`,
              emojiLine,
              timeSeconds: elapsed,
              perfect: correctCount === puzzle.headlines.length,
            },
          });
          return { streak };
        })();
      trackGameCompleted('schlagloch', 'won', get().isArchive, correctCount, elapsed);
      clearGameProgress('schlagloch');
      set({ status: 'finished', elapsedSeconds: elapsed, ...streakUpdate2 });
    } else {
      set({ currentIndex: nextIndex, lastGuessResult: null });
      persistSchlagloch(get());
    }
  },

  clearLastResult: () => set({ lastGuessResult: null }),
}));
