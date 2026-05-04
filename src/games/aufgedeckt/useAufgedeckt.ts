import { create } from 'zustand';
import type { AufgedecktPuzzle, StreakData } from '@/types';
import { SAMPLE_AUFGEDECKT } from './aufgedeckt.data';
import { fetchTodaysPuzzle, fetchPuzzleByDate } from '@/lib/supabase';
import { getTodayDateCET } from '@/lib/dateUtils';
import { getStreak } from '@/lib/streaks';
import { saveGameProgress, loadGameProgress, clearGameProgress } from '@/lib/gamePersistence';
import { completeGame } from '@/lib/completeGame';
import { normalizeText } from '@/lib/textNormalization';

const DEFAULT_COLS = 5;
const DEFAULT_ROWS = 5;

type RoundResult = 'correct' | 'wrong' | null;

interface AufgedecktState {
  puzzle: AufgedecktPuzzle | null;
  /** Round index (0-based). */
  currentIndex: number;
  /** Per-round revealed-tile sets. */
  revealedTiles: number[][];
  /** Per-round outcome. */
  results: RoundResult[];
  /** Total tiles revealed across all rounds — secondary score. */
  totalRevealed: number;
  startedAt: number | null;
  status: 'loading' | 'playing' | 'finished';
  isArchive: boolean;
  streak: StreakData;

  loadPuzzle: (archiveDate?: string) => Promise<void>;
  revealTile: (tileIndex: number) => void;
  submitGuess: (guess: string) => boolean;
  skipRound: () => void;
  next: () => void;
}

interface AufgedecktProgress {
  puzzleId: string;
  currentIndex: number;
  revealedTiles: number[][];
  results: RoundResult[];
  totalRevealed: number;
  startedAt: number;
}

function persistAufgedeckt(state: AufgedecktState): void {
  if (state.isArchive || !state.puzzle || state.status !== 'playing') return;
  saveGameProgress<AufgedecktProgress>('aufgedeckt', state.puzzle.id, {
    puzzleId: state.puzzle.id,
    currentIndex: state.currentIndex,
    revealedTiles: state.revealedTiles,
    results: state.results,
    totalRevealed: state.totalRevealed,
    startedAt: state.startedAt ?? Date.now(),
  });
}

const normalize = (s: string) => normalizeText(s);

export const useAufgedeckt = create<AufgedecktState>((set, get) => ({
  puzzle: null,
  currentIndex: 0,
  revealedTiles: [],
  results: [],
  totalRevealed: 0,
  startedAt: null,
  status: 'loading',
  isArchive: false,
  streak: getStreak('aufgedeckt'),

  loadPuzzle: async (archiveDate?: string) => {
    set({ status: 'loading', isArchive: !!archiveDate });
    const fetched = archiveDate
      ? await fetchPuzzleByDate<AufgedecktPuzzle>('aufgedeckt', archiveDate)
      : await fetchTodaysPuzzle<AufgedecktPuzzle>('aufgedeckt');
    const fallbackDate = archiveDate ?? getTodayDateCET();
    const puzzle: AufgedecktPuzzle = fetched ?? { ...SAMPLE_AUFGEDECKT, date: fallbackDate };

    if (!archiveDate) {
      const saved = loadGameProgress<AufgedecktProgress>('aufgedeckt', puzzle.id);
      if (saved && saved.results.some((r) => r === null)) {
        set({
          puzzle,
          currentIndex: saved.currentIndex,
          revealedTiles: saved.revealedTiles,
          results: saved.results,
          totalRevealed: saved.totalRevealed,
          startedAt: saved.startedAt,
          status: 'playing',
        });
        return;
      }
    }

    clearGameProgress('aufgedeckt');
    set({
      puzzle,
      currentIndex: 0,
      revealedTiles: puzzle.rounds.map(() => []),
      results: puzzle.rounds.map(() => null),
      totalRevealed: 0,
      startedAt: Date.now(),
      status: 'playing',
    });
  },

  revealTile: (tileIndex) => {
    const { puzzle, currentIndex, revealedTiles, results, totalRevealed } = get();
    if (!puzzle) return;
    if (results[currentIndex] !== null) return;
    const current = revealedTiles[currentIndex] ?? [];
    if (current.includes(tileIndex)) return;
    const cols = puzzle.rounds[currentIndex].cols ?? DEFAULT_COLS;
    const rows = puzzle.rounds[currentIndex].rows ?? DEFAULT_ROWS;
    if (current.length >= cols * rows) return;
    const updated = [...revealedTiles];
    updated[currentIndex] = [...current, tileIndex];
    set({ revealedTiles: updated, totalRevealed: totalRevealed + 1 });
    persistAufgedeckt(get());
  },

  submitGuess: (guess) => {
    const { puzzle, currentIndex, results } = get();
    if (!puzzle) return false;
    if (results[currentIndex] !== null) return false;
    const round = puzzle.rounds[currentIndex];
    const normalizedGuess = normalize(guess);
    const matched = round.accepted_answers.some(
      (a) => normalize(a) === normalizedGuess && normalizedGuess.length > 0,
    );
    if (!matched) return false;

    const updatedResults = [...results];
    updatedResults[currentIndex] = 'correct';
    set({ results: updatedResults });
    persistAufgedeckt(get());
    return true;
  },

  skipRound: () => {
    const { puzzle, currentIndex, results } = get();
    if (!puzzle || results[currentIndex] !== null) return;
    const updated = [...results];
    updated[currentIndex] = 'wrong';
    set({ results: updated });
    persistAufgedeckt(get());
  },

  next: () => {
    const { puzzle, currentIndex, results, isArchive, startedAt, totalRevealed } = get();
    if (!puzzle) return;
    const isLast = currentIndex >= puzzle.rounds.length - 1;
    if (!isLast) {
      set({ currentIndex: currentIndex + 1 });
      persistAufgedeckt(get());
      return;
    }

    // Finalize.
    const correct = results.filter((r) => r === 'correct').length;
    const total = puzzle.rounds.length;
    const elapsed = startedAt ? Math.round((Date.now() - startedAt) / 1000) : null;

    if (!isArchive) {
      const streak = completeGame({
        gameType: 'aufgedeckt',
        score: correct,
        elapsed: totalRevealed,
        dailyResult: {
          outcome: correct >= total / 2 ? 'won' : 'lost',
          summary: `${correct}/${total} · ${totalRevealed} Felder`,
          timeSeconds: elapsed,
          perfect: correct === total,
        },
      });
      set({ streak });
    }
    clearGameProgress('aufgedeckt');
    set({ status: 'finished' });
  },
}));
