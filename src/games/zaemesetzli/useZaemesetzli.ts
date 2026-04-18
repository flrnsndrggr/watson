import { create } from 'zustand';
import type { ZaemesetzliPuzzle, Rank, CompoundWord } from '@/types';
import { SAMPLE_ZAEMESETZLI, DEMO_COMPOUND_MAP } from './zaemesetzli.data';

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
  lastRankUp: Rank | null;
  hintsUsed: number;
  lastResult: 'valid' | 'mundart' | 'not-in-puzzle' | 'invalid' | 'already-found' | 'wrong-emojis' | null;

  loadPuzzle: () => void;
  selectEmoji: (emoji: string) => void;
  clearEmojiSelection: () => void;
  setInput: (input: string) => void;
  submitWord: () => void;
  useHint: () => string | null;
  clearLastResult: () => void;
  clearRankUp: () => void;
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
  lastRankUp: null,
  hintsUsed: 0,
  lastResult: null,

  loadPuzzle: () => {
    set({
      puzzle: SAMPLE_ZAEMESETZLI,
      selectedEmojis: [],
      currentInput: '',
      foundWords: [],
      score: 0,
      currentRank: 'stift',
      lastRankUp: null,
      hintsUsed: 0,
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
  clearRankUp: () => set({ lastRankUp: null }),

  submitWord: () => {
    const { currentInput, selectedEmojis, foundWords, score, puzzle } = get();
    if (!puzzle || !currentInput.trim()) return;

    const word = currentInput.trim().toLowerCase();

    // Already found?
    if (foundWords.some((fw) => fw.word.toLowerCase() === word)) {
      set({ lastResult: 'already-found', currentInput: '' });
      return;
    }

    // Check against demo compounds
    const compound = DEMO_COMPOUND_MAP.get(word);

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
    const { currentRank } = get();
    const newRank = getRank(newScore, puzzle.rank_thresholds);
    const didRankUp = newRank !== currentRank;

    set({
      foundWords: [...foundWords, newFound],
      score: newScore,
      currentRank: newRank,
      lastRankUp: didRankUp ? newRank : null,
      currentInput: '',
      selectedEmojis: [],
      lastResult: compound.is_mundart ? 'mundart' : 'valid',
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
