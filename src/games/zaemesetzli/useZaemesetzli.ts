import { create } from 'zustand';
import type { ZaemesetzliPuzzle, Rank, CompoundWord, StreakData } from '@/types';
import { SAMPLE_ZAEMESETZLI } from './zaemesetzli.data';
import { fetchTodaysPuzzle, fetchPuzzleByDate } from '@/lib/supabase';
import { recordGamePlayed, getStreak } from '@/lib/streaks';
import { submitLeaderboardEntry } from '@/lib/leaderboard';
import { trackGameStarted, trackGameCompleted, checkStreakMilestone } from '@/lib/analytics';
import { saveDailyResult } from '@/lib/dailyResults';

interface FoundCompound extends CompoundWord {
  foundAt: number;
}

interface ZaemesetzliState {
  puzzle: ZaemesetzliPuzzle | null;
  selectedEmojis: string[];
  currentInput: string;
  foundWords: FoundCompound[];
  score: number;
  currentRank: Rank;
  hintsUsed: number;
  lastResult: 'valid' | 'mundart' | 'not-in-puzzle' | 'invalid' | 'already-found' | 'wrong-emojis' | null;
  lastResultId: number;
  status: 'playing' | 'complete';
  streak: StreakData;
  isArchive: boolean;

  loadPuzzle: (archiveDate?: string) => Promise<void>;
  selectEmoji: (emoji: string) => void;
  clearEmojiSelection: () => void;
  setInput: (input: string) => void;
  submitWord: () => void;
  useHint: () => string | null;
  clearLastResult: () => void;
}

function getRank(score: number, thresholds: ZaemesetzliPuzzle['rank_thresholds']): Rank {
  if (score >= thresholds.bundesrat) return 'bundesrat';
  if (score >= thresholds.meister) return 'meister';
  if (score >= thresholds.geselle) return 'geselle';
  if (score >= thresholds.lehrling) return 'lehrling';
  return 'stift';
}

export const useZaemesetzli = create<ZaemesetzliState>((set, get) => ({
  puzzle: null,
  selectedEmojis: [],
  currentInput: '',
  foundWords: [],
  score: 0,
  currentRank: 'stift',
  hintsUsed: 0,
  lastResult: null,
  lastResultId: 0,
  status: 'playing',
  streak: getStreak('zaemesetzli'),
  isArchive: false,

  loadPuzzle: async (archiveDate?: string) => {
    set({ isArchive: !!archiveDate });
    const fetched = archiveDate
      ? await fetchPuzzleByDate<ZaemesetzliPuzzle>('zaemesetzli', archiveDate)
      : await fetchTodaysPuzzle<ZaemesetzliPuzzle>('zaemesetzli');
    const puzzle = fetched ?? SAMPLE_ZAEMESETZLI;
    set({
      puzzle,
      selectedEmojis: [],
      currentInput: '',
      foundWords: [],
      score: 0,
      currentRank: 'stift',
      hintsUsed: 0,
      status: 'playing',
    });
    trackGameStarted('zaemesetzli', !!archiveDate);
  },

  selectEmoji: (emoji) => {
    const { selectedEmojis } = get();
    if (selectedEmojis.length < 3 && !selectedEmojis.includes(emoji)) {
      set({ selectedEmojis: [...selectedEmojis, emoji] });
    }
  },

  clearEmojiSelection: () => set({ selectedEmojis: [], currentInput: '' }),

  setInput: (input) => set({ currentInput: input }),

  clearLastResult: () => set({ lastResult: null }),

  submitWord: () => {
    const { currentInput, selectedEmojis, foundWords, score, puzzle } = get();
    if (!puzzle || !currentInput.trim()) return;

    const word = currentInput.trim().toLowerCase();

    // Already found?
    if (foundWords.some((fw) => fw.word.toLowerCase() === word)) {
      set((s) => ({ lastResult: 'already-found', lastResultId: s.lastResultId + 1, currentInput: '' }));
      return;
    }

    // Check against puzzle compounds
    const compound = puzzle.valid_compounds.find((c) => c.word.toLowerCase() === word);

    if (!compound) {
      set((s) => ({ lastResult: 'invalid', lastResultId: s.lastResultId + 1, currentInput: '' }));
      return;
    }

    // Check if emojis match
    const selectedSet = new Set(selectedEmojis);
    const compSet = new Set(compound.components);
    const emojisMatch = compSet.size === selectedSet.size && [...compSet].every((e) => selectedSet.has(e));

    if (!emojisMatch) {
      set((s) => ({ lastResult: 'wrong-emojis', lastResultId: s.lastResultId + 1, currentInput: '' }));
      return;
    }

    const newFound: FoundCompound = { ...compound, foundAt: Date.now() };
    const newScore = score + compound.points;
    const newRank = getRank(newScore, puzzle.rank_thresholds);
    const newFoundWords = [...foundWords, newFound];
    const allFound = newFoundWords.length === puzzle.valid_compounds.length;

    // Record streak on first word found (skip for archive)
    const streakUpdate = foundWords.length === 0 && !get().isArchive
      ? (() => {
          const streak = recordGamePlayed('zaemesetzli');
          checkStreakMilestone('zaemesetzli', streak.current);
          return { streak };
        })()
      : {};

    // Submit to leaderboard on each word found (upsert keeps latest score)
    if (!get().isArchive) {
      void submitLeaderboardEntry('zaemesetzli', newScore, null);
    }

    if (allFound) {
      trackGameCompleted('zaemesetzli', 'complete', get().isArchive, newScore);
      if (!get().isArchive) {
        const rankLabel = newRank.charAt(0).toUpperCase() + newRank.slice(1);
        saveDailyResult('zaemesetzli', {
          outcome: 'complete',
          summary: `${newFoundWords.length}/${puzzle.valid_compounds.length} \u00B7 ${rankLabel}`,
        });
      }
    }

    set({
      foundWords: newFoundWords,
      score: newScore,
      currentRank: newRank,
      currentInput: '',
      selectedEmojis: [],
      lastResult: compound.is_mundart ? 'mundart' : 'valid',
      lastResultId: get().lastResultId + 1,
      status: allFound ? 'complete' : 'playing',
      ...streakUpdate,
    });
  },

  useHint: () => {
    const { puzzle, foundWords, hintsUsed, score } = get();
    if (!puzzle) return null;

    const foundWordSet = new Set(foundWords.map((fw) => fw.word.toLowerCase()));
    const unfound = puzzle.valid_compounds.filter((c) => !foundWordSet.has(c.word.toLowerCase()));
    if (unfound.length === 0) return null;

    const hint = unfound[0];
    set({
      hintsUsed: hintsUsed + 1,
      score: Math.max(0, score - 1),
      selectedEmojis: hint.components,
      currentInput: '',
    });
    return `${hint.components.join(' + ')} = ?`;
  },
}));
