import { create } from 'zustand';
import type { VerbindigeGroup, VerbindigeItem, VerbindigePuzzle } from '@/types';
import { SAMPLE_VERBINDIGE } from './verbindige.data';
import { fetchTodaysPuzzle } from '@/lib/supabase';
import { showToast } from '@/components/shared/Toast';

interface SolvedGroup extends VerbindigeGroup {
  guessOrder: number;
}

interface VerbindigeState {
  puzzle: VerbindigePuzzle | null;
  selected: VerbindigeItem[];
  solvedGroups: SolvedGroup[];
  mistakes: number;
  maxMistakes: number;
  status: 'loading' | 'playing' | 'won' | 'lost';
  error: string | null;
  remainingItems: VerbindigeItem[];
  lastGuessResult: 'correct' | 'wrong' | 'one-away' | null;
  lastWrongItems: VerbindigeItem[];

  loadPuzzle: () => Promise<void>;
  toggleItem: (item: VerbindigeItem) => void;
  clearSelection: () => void;
  submitGuess: () => void;
  clearLastResult: () => void;
  clearWrongItems: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const useVerbindige = create<VerbindigeState>((set, get) => ({
  puzzle: null,
  selected: [],
  solvedGroups: [],
  mistakes: 0,
  maxMistakes: 4,
  status: 'loading',
  error: null,
  remainingItems: [],
  lastGuessResult: null,
  lastWrongItems: [],

  loadPuzzle: async () => {
    set({ status: 'loading', error: null });
    const fetched = await fetchTodaysPuzzle<VerbindigePuzzle>('verbindige');
    const puzzle = fetched ?? SAMPLE_VERBINDIGE;
    const allItems = shuffleArray(puzzle.groups.flatMap((g) => g.items));
    set({ puzzle, remainingItems: allItems, status: 'playing', selected: [], solvedGroups: [], mistakes: 0 });
  },

  toggleItem: (item) => {
    const { selected, status } = get();
    if (status !== 'playing') return;
    const isSelected = selected.some((s) => s.text === item.text);
    if (isSelected) {
      set({ selected: selected.filter((s) => s.text !== item.text) });
    } else if (selected.length < 4) {
      set({ selected: [...selected, item] });
    }
  },

  clearSelection: () => set({ selected: [] }),

  clearLastResult: () => set({ lastGuessResult: null }),
  clearWrongItems: () => set({ lastWrongItems: [] }),

  submitGuess: () => {
    const { selected, puzzle, solvedGroups, mistakes, maxMistakes, remainingItems } = get();
    if (!puzzle || selected.length !== 4) return;

    const selectedTexts = new Set(selected.map((s) => s.text));

    // Check against each unsolved group
    const unsolvedGroups = puzzle.groups.filter(
      (g) => !solvedGroups.some((sg) => sg.category === g.category),
    );

    const matchedGroup = unsolvedGroups.find((g) =>
      g.items.every((item) => selectedTexts.has(item.text)),
    );

    if (matchedGroup) {
      const newSolvedGroups = [
        ...solvedGroups,
        { ...matchedGroup, guessOrder: solvedGroups.length },
      ];
      const newRemaining = remainingItems.filter((item) => !selectedTexts.has(item.text));
      const won = newSolvedGroups.length === 4;

      set({
        solvedGroups: newSolvedGroups,
        selected: [],
        remainingItems: newRemaining,
        lastGuessResult: 'correct',
        status: won ? 'won' : 'playing',
      });
    } else {
      // Check if "one away" — 3 out of 4 correct in any group
      const isOneAway = unsolvedGroups.some((g) => {
        const overlap = g.items.filter((item) => selectedTexts.has(item.text));
        return overlap.length === 3;
      });

      const newMistakes = mistakes + 1;
      const lost = newMistakes >= maxMistakes;
      const result = isOneAway ? 'one-away' : 'wrong';

      if (result === 'one-away') {
        showToast('Fast! Nur 1 falsch.');
      }

      set({
        mistakes: newMistakes,
        selected: [],
        lastWrongItems: selected,
        lastGuessResult: result,
        status: lost ? 'lost' : 'playing',
      });

      // If lost, reveal all groups
      if (lost) {
        set({
          solvedGroups: puzzle.groups.map((g, i) => ({ ...g, guessOrder: i })),
          remainingItems: [],
        });
      }
    }
  },
}));
