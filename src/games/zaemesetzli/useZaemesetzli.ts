import { create } from 'zustand';
import type { ZaemesetzliPuzzle, Rank, CompoundWord, StreakData } from '@/types';
import { SAMPLE_ZAEMESETZLI } from './zaemesetzli.data';
import { fetchTodaysPuzzle } from '@/lib/supabase';
import { recordGamePlayed, getStreak } from '@/lib/streaks';

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
  status: 'playing' | 'complete';
  streak: StreakData;

  loadPuzzle: () => Promise<void>;
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
  status: 'playing',
  streak: getStreak('zaemesetzli'),

  loadPuzzle: async () => {
    const fetched = await fetchTodaysPuzzle<ZaemesetzliPuzzle>('zaemesetzli');
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
      set({ lastResult: 'already-found', currentInput: '' });
      return;
    }

    // Check against puzzle compounds
    const compound = puzzle.valid_compounds.find((c) => c.word.toLowerCase() === word);

    if (!compound) {
      set({ lastResult: 'invalid', currentInput: '' });
      return;
    }

    // Check if emojis match
    const selectedSet = new Set(selectedEmojis);
    const compSet = new Set(compound.components);
    const emojisMatch = compSet.size === selectedSet.size && [...compSet].every((e) => selectedSet.has(e));

    if (!emojisMatch) {
      set({ lastResult: 'wrong-emojis', currentInput: '' });
      return;
    }

    const newFound: FoundCompound = { ...compound, foundAt: Date.now() };
    const newScore = score + compound.points;
    const newRank = getRank(newScore, puzzle.rank_thresholds);
    const newFoundWords = [...foundWords, newFound];
    const allFound = newFoundWords.length === puzzle.valid_compounds.length;

    // Record streak on first word found
    const streakUpdate = foundWords.length === 0
      ? { streak: recordGamePlayed('zaemesetzli') }
      : {};

    set({
      foundWords: newFoundWords,
      score: newScore,
      currentRank: newRank,
      currentInput: '',
      selectedEmojis: [],
      lastResult: compound.is_mundart ? 'mundart' : 'valid',
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
    });
    return `${hint.components.join(' + ')} = ?`;
  },
}));
