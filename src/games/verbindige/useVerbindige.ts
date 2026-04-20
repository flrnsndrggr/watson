import { create } from 'zustand';
import type { VerbindigeGroup, VerbindigeItem, VerbindigePuzzle, StreakData } from '@/types';
import { SAMPLE_VERBINDIGE } from './verbindige.data';
import { fetchTodaysPuzzle, fetchPuzzleByDate } from '@/lib/supabase';
import { showToast } from '@/components/shared/Toast';
import { recordGamePlayed, getStreak } from '@/lib/streaks';
import { submitLeaderboardEntry } from '@/lib/leaderboard';
import { trackGameStarted, trackGameCompleted, checkStreakMilestone } from '@/lib/analytics';
import { saveDailyResult } from '@/lib/dailyResults';
import { saveGameProgress, loadGameProgress, clearGameProgress } from '@/lib/gamePersistence';

interface SolvedGroup extends VerbindigeGroup {
  guessOrder: number;
  revealedOnLoss?: boolean;
}

interface PendingCorrectGroup {
  group: SolvedGroup;
  itemTexts: Set<string>;
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
  lastGuessResult: 'correct' | 'wrong' | 'one-away' | 'duplicate' | null;
  lastWrongItems: VerbindigeItem[];
  pendingCorrect: PendingCorrectGroup | null;
  previousGuesses: string[];
  streak: StreakData;
  isArchive: boolean;
  startedAt: number | null;
  elapsedSeconds: number | null;

  loadPuzzle: (archiveDate?: string) => Promise<void>;
  toggleItem: (item: VerbindigeItem) => void;
  shuffleRemaining: () => void;
  clearSelection: () => void;
  submitGuess: () => void;
  confirmCorrectGroup: () => void;
  clearLastResult: () => void;
  clearWrongItems: () => void;
}

interface VerbindigeProgress {
  remainingItems: VerbindigeItem[];
  solvedGroups: SolvedGroup[];
  mistakes: number;
  previousGuesses: string[];
  startedAt: number | null;
}

function persistState(state: VerbindigeState): void {
  if (state.isArchive || !state.puzzle || state.status !== 'playing') return;
  saveGameProgress<VerbindigeProgress>('verbindige', state.puzzle.id, {
    remainingItems: state.remainingItems,
    solvedGroups: state.solvedGroups,
    mistakes: state.mistakes,
    previousGuesses: state.previousGuesses,
    startedAt: state.startedAt,
  });
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
  pendingCorrect: null,
  previousGuesses: [],
  streak: getStreak('verbindige'),
  isArchive: false,
  startedAt: null,
  elapsedSeconds: null,

  loadPuzzle: async (archiveDate?: string) => {
    set({ status: 'loading', error: null, isArchive: !!archiveDate });
    const fetched = archiveDate
      ? await fetchPuzzleByDate<VerbindigePuzzle>('verbindige', archiveDate)
      : await fetchTodaysPuzzle<VerbindigePuzzle>('verbindige');
    const puzzle = fetched ?? SAMPLE_VERBINDIGE;

    // Restore in-progress state for today's puzzle
    if (!archiveDate) {
      const saved = loadGameProgress<VerbindigeProgress>('verbindige', puzzle.id);
      if (saved && saved.remainingItems.length > 0) {
        set({
          puzzle,
          remainingItems: saved.remainingItems,
          solvedGroups: saved.solvedGroups,
          mistakes: saved.mistakes,
          previousGuesses: saved.previousGuesses,
          startedAt: saved.startedAt,
          status: 'playing',
          selected: [],
          elapsedSeconds: null,
        });
        trackGameStarted('verbindige', false);
        return;
      }
    }

    const allItems = shuffleArray(puzzle.groups.flatMap((g) => g.items));
    clearGameProgress('verbindige');
    set({ puzzle, remainingItems: allItems, status: 'playing', selected: [], solvedGroups: [], mistakes: 0, previousGuesses: [], startedAt: Date.now(), elapsedSeconds: null });
    trackGameStarted('verbindige', !!archiveDate);
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

  shuffleRemaining: () => {
    const { remainingItems } = get();
    set({ remainingItems: shuffleArray(remainingItems) });
  },

  clearSelection: () => set({ selected: [] }),

  clearLastResult: () => set({ lastGuessResult: null }),
  clearWrongItems: () => set({ lastWrongItems: [] }),

  confirmCorrectGroup: () => {
    const { pendingCorrect, solvedGroups, remainingItems } = get();
    if (!pendingCorrect) return;

    const newSolvedGroups = [...solvedGroups, pendingCorrect.group];
    const newRemaining = remainingItems.filter(
      (item) => !pendingCorrect.itemTexts.has(item.text),
    );
    const won = newSolvedGroups.length === 4;
    const updates: Partial<VerbindigeState> = {
      solvedGroups: newSolvedGroups,
      remainingItems: newRemaining,
      pendingCorrect: null,
      status: won ? 'won' : 'playing',
    };
    if (won) {
      const elapsed = get().startedAt ? Math.round((Date.now() - get().startedAt!) / 1000) : null;
      updates.elapsedSeconds = elapsed;
      const score = 4 - get().mistakes;
      if (!get().isArchive) {
        updates.streak = recordGamePlayed('verbindige');
        checkStreakMilestone('verbindige', updates.streak.current);
        void submitLeaderboardEntry('verbindige', score, elapsed);
      }
      trackGameCompleted('verbindige', 'won', get().isArchive, score, elapsed);
      if (!get().isArchive) {
        const emojiMap: Record<number, string> = { 1: '\u{1F7E8}', 2: '\u{1F7E9}', 3: '\u{1F7E6}', 4: '\u{1F7EA}' };
        const emojiLine = [...newSolvedGroups]
          .sort((a, b) => a.guessOrder - b.guessOrder)
          .map((g) => (emojiMap[g.difficulty] ?? '').repeat(4))
          .join('\n');
        saveDailyResult('verbindige', {
          outcome: 'won',
          summary: `${get().mistakes}/4 Fehler`,
          emojiLine,
          timeSeconds: elapsed,
        });
      }
      clearGameProgress('verbindige');
    }
    set(updates);

    // Persist after correct group (if still playing)
    if (!won) {
      persistState({ ...get(), ...updates } as VerbindigeState);
    }
  },

  submitGuess: () => {
    const { selected, puzzle, solvedGroups, mistakes, maxMistakes, previousGuesses } = get();
    if (!puzzle || selected.length !== 4) return;

    const selectedTexts = new Set(selected.map((s) => s.text));

    // Create a canonical key for this guess (sorted to be order-independent)
    const guessKey = [...selectedTexts].sort().join('|');

    // Check for duplicate guess — don't consume a mistake
    if (previousGuesses.includes(guessKey)) {
      showToast('Schon probiert!');
      set({ selected: [], lastGuessResult: 'duplicate' });
      return;
    }

    // Check against each unsolved group
    const unsolvedGroups = puzzle.groups.filter(
      (g) => !solvedGroups.some((sg) => sg.category === g.category),
    );

    const matchedGroup = unsolvedGroups.find((g) =>
      g.items.every((item) => selectedTexts.has(item.text)),
    );

    if (matchedGroup) {
      // Phase 1: Flash tiles with difficulty color — don't remove yet
      const pending: PendingCorrectGroup = {
        group: { ...matchedGroup, guessOrder: solvedGroups.length },
        itemTexts: selectedTexts,
      };
      set({
        pendingCorrect: pending,
        selected: [],
        lastGuessResult: 'correct',
      });
    } else {
      // Record this wrong guess so it can't be repeated
      const newPreviousGuesses = [...previousGuesses, guessKey];

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
      } else {
        showToast('Leider falsch.');
      }

      const lostUpdates: Partial<VerbindigeState> = {
        mistakes: newMistakes,
        selected: [],
        lastWrongItems: selected,
        lastGuessResult: result,
        previousGuesses: newPreviousGuesses,
        status: lost ? 'lost' : 'playing',
      };
      if (lost) {
        const elapsed = get().startedAt ? Math.round((Date.now() - get().startedAt!) / 1000) : null;
        lostUpdates.elapsedSeconds = elapsed;
        if (!get().isArchive) {
          lostUpdates.streak = recordGamePlayed('verbindige');
          checkStreakMilestone('verbindige', lostUpdates.streak.current);
          void submitLeaderboardEntry('verbindige', 0, elapsed);
        }
        trackGameCompleted('verbindige', 'lost', get().isArchive, 0, elapsed);
        if (!get().isArchive) {
          saveDailyResult('verbindige', {
            outcome: 'lost',
            summary: 'Knapp daneben',
            timeSeconds: elapsed,
          });
        }
      }
      set(lostUpdates);

      // Persist progress or clear on loss
      if (lost) {
        clearGameProgress('verbindige');
      } else {
        persistState(get());
      }

      // If lost, reveal unsolved groups with revealedOnLoss flag
      if (lost) {
        const alreadySolved = get().solvedGroups;
        const solvedCategories = new Set(alreadySolved.map((sg) => sg.category));
        const unsolvedGroups = puzzle.groups
          .filter((g) => !solvedCategories.has(g.category))
          .sort((a, b) => a.difficulty - b.difficulty)
          .map((g, i) => ({
            ...g,
            guessOrder: alreadySolved.length + i,
            revealedOnLoss: true,
          }));
        set({
          solvedGroups: [...alreadySolved, ...unsolvedGroups],
          remainingItems: [],
        });
      }
    }
  },
}));
