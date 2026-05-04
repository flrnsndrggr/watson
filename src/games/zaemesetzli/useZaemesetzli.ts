import { create } from 'zustand';
import type { ZaemesetzliPuzzle, Rank, CompoundWord, StreakData } from '@/types';
import { SAMPLE_ZAEMESETZLI } from './zaemesetzli.data';
import { fetchTodaysPuzzle, fetchPuzzleByDate } from '@/lib/supabase';
import { getTodayDateCET } from '@/lib/dateUtils';
import { recordGamePlayed, getStreak, getStreak as readStreak } from '@/lib/streaks';
import { submitLeaderboardEntry } from '@/lib/leaderboard';
import { trackGameStarted, trackGameCompleted, checkStreakMilestone, trackZaemesetzliWordFound, trackZaemesetzliHintUsed } from '@/lib/analytics';
import { saveDailyResult } from '@/lib/dailyResults';
import { saveGameProgress, loadGameProgress, clearGameProgress } from '@/lib/gamePersistence';
import { triggerAccountPrompt } from '@/components/shared/AccountPromptHost';
import { checkAchievements } from '@/lib/achievements';
import { completeGame } from '@/lib/completeGame';

interface FoundCompound extends CompoundWord {
  foundAt: number;
}

interface CelebrationData {
  components: string[];
  word: string;
  points: number;
  is_mundart: boolean;
}

interface ZaemesetzliState {
  puzzle: ZaemesetzliPuzzle | null;
  selectedEmojis: string[];
  foundWords: FoundCompound[];
  score: number;
  currentRank: Rank;
  hintsUsed: number;
  /**
   * `valid` / `mundart`: at least one new compound matched the selected emoji set.
   * `already-found`: every compound for this emoji set was already found.
   * `invalid`: no compound exists for this emoji set.
   */
  lastResult: 'valid' | 'mundart' | 'invalid' | 'already-found' | null;
  lastResultId: number;
  /** Extra compounds awarded on the same submit, beyond the celebrated one. */
  lastExtraFound: FoundCompound[];
  lastFoundCompound: CelebrationData | null;
  status: 'playing' | 'complete' | 'finished';
  streak: StreakData;
  isArchive: boolean;

  loadPuzzle: (archiveDate?: string) => Promise<void>;
  selectEmoji: (emoji: string) => void;
  deselectEmoji: (emoji: string) => void;
  clearEmojiSelection: () => void;
  submitCombination: () => void;
  finishGame: () => void;
  useHint: () => string | null;
  clearLastResult: () => void;
}

interface ZaemesetzliProgress {
  foundWords: FoundCompound[];
  score: number;
  currentRank: Rank;
  hintsUsed: number;
}

/** Stable string key for an unordered emoji multiset. */
function emojiSetKey(emojis: readonly string[]): string {
  return [...emojis].sort().join('|');
}

function persistZaemesetzli(state: ZaemesetzliState): void {
  if (state.isArchive || !state.puzzle || state.status !== 'playing') return;
  saveGameProgress<ZaemesetzliProgress>('zaemesetzli', state.puzzle.id, {
    foundWords: state.foundWords,
    score: state.score,
    currentRank: state.currentRank,
    hintsUsed: state.hintsUsed,
  });
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
  foundWords: [],
  score: 0,
  currentRank: 'stift',
  hintsUsed: 0,
  lastResult: null,
  lastResultId: 0,
  lastExtraFound: [],
  lastFoundCompound: null,
  status: 'playing',
  streak: getStreak('zaemesetzli'),
  isArchive: false,

  loadPuzzle: async (archiveDate?: string) => {
    set({ isArchive: !!archiveDate });
    const fetched = archiveDate
      ? await fetchPuzzleByDate<ZaemesetzliPuzzle>('zaemesetzli', archiveDate)
      : await fetchTodaysPuzzle<ZaemesetzliPuzzle>('zaemesetzli');
    const fallbackDate = archiveDate ?? getTodayDateCET();
    const puzzle = fetched ?? { ...SAMPLE_ZAEMESETZLI, date: fallbackDate };

    // Restore in-progress state for today's puzzle
    if (!archiveDate) {
      const saved = loadGameProgress<ZaemesetzliProgress>('zaemesetzli', puzzle.id);
      if (saved && saved.foundWords.length > 0 && saved.foundWords.length < puzzle.valid_compounds.length) {
        set({
          puzzle,
          foundWords: saved.foundWords,
          score: saved.score,
          currentRank: saved.currentRank,
          hintsUsed: saved.hintsUsed,
          selectedEmojis: [],
          status: 'playing',
        });
        // Re-record streak since it fires on first word found
        if (!get().isArchive) {
          const streak = recordGamePlayed('zaemesetzli');
          set({ streak });
        }
        trackGameStarted('zaemesetzli', false);
        return;
      }
    }

    clearGameProgress('zaemesetzli');
    set({
      puzzle,
      selectedEmojis: [],
      foundWords: [],
      score: 0,
      currentRank: 'stift',
      hintsUsed: 0,
      lastFoundCompound: null,
      lastExtraFound: [],
      status: 'playing',
    });
    trackGameStarted('zaemesetzli', !!archiveDate);
  },

  selectEmoji: (emoji) => {
    const { selectedEmojis } = get();
    // Toggle: tap again to deselect
    if (selectedEmojis.includes(emoji)) {
      set({ selectedEmojis: selectedEmojis.filter((e) => e !== emoji) });
    } else if (selectedEmojis.length < 3) {
      set({ selectedEmojis: [...selectedEmojis, emoji] });
    }
  },

  deselectEmoji: (emoji) => {
    const { selectedEmojis } = get();
    set({ selectedEmojis: selectedEmojis.filter((e) => e !== emoji) });
  },

  clearEmojiSelection: () => set({ selectedEmojis: [] }),

  clearLastResult: () => set({ lastResult: null, lastFoundCompound: null, lastExtraFound: [] }),

  submitCombination: () => {
    const { selectedEmojis, foundWords, score, puzzle } = get();
    if (!puzzle || selectedEmojis.length < 2) return;

    const targetKey = emojiSetKey(selectedEmojis);

    // Find every compound that matches the selected emoji set (order-insensitive,
    // duplicates not allowed — selectEmoji already prevents duplicate selection).
    const allMatches = puzzle.valid_compounds.filter(
      (c) => emojiSetKey(c.components) === targetKey,
    );

    if (allMatches.length === 0) {
      set((s) => ({ lastResult: 'invalid', lastResultId: s.lastResultId + 1 }));
      return;
    }

    const foundWordSet = new Set(foundWords.map((fw) => fw.word.toLowerCase()));
    const newMatches = allMatches.filter((c) => !foundWordSet.has(c.word.toLowerCase()));

    if (newMatches.length === 0) {
      set((s) => ({ lastResult: 'already-found', lastResultId: s.lastResultId + 1 }));
      return;
    }

    // Celebrate the highest-scoring new match (mundart bonus tends to win);
    // toast the rest via lastExtraFound.
    const sorted = [...newMatches].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return Number(b.is_mundart) - Number(a.is_mundart);
    });
    const [primary, ...extras] = sorted;

    const now = Date.now();
    const newFound: FoundCompound[] = sorted.map((c) => ({ ...c, foundAt: now }));
    const newFoundWords = [...foundWords, ...newFound];
    const gainedPoints = newFound.reduce((sum, c) => sum + c.points, 0);
    const newScore = score + gainedPoints;
    const newRank = getRank(newScore, puzzle.rank_thresholds);
    const allFound = newFoundWords.length === puzzle.valid_compounds.length;
    const isArchiveSession = get().isArchive;

    // Track each found compound as an individual word-found event so analytics
    // stay comparable to the old per-word flow.
    for (const c of newFound) {
      trackZaemesetzliWordFound(c.difficulty, c.is_mundart, c.points, newScore, newFoundWords.length);
    }

    // Record streak on first word found (skip for archive)
    const streakUpdate = foundWords.length === 0 && !isArchiveSession
      ? (() => {
          const streak = recordGamePlayed('zaemesetzli');
          checkStreakMilestone('zaemesetzli', streak.current);
          return { streak };
        })()
      : {};

    if (!isArchiveSession) {
      void submitLeaderboardEntry('zaemesetzli', newScore, null);
    }

    if (allFound) {
      trackGameCompleted('zaemesetzli', 'complete', isArchiveSession, newScore);
      if (!isArchiveSession) {
        const rankLabel = newRank.charAt(0).toUpperCase() + newRank.slice(1);
        const totalMundart = puzzle.valid_compounds.filter((c) => c.is_mundart).length;
        const foundMundart = newFoundWords.filter((c) => c.is_mundart).length;
        saveDailyResult('zaemesetzli', {
          outcome: 'complete',
          summary: `${newFoundWords.length}/${puzzle.valid_compounds.length} \u00B7 ${rankLabel}`,
          perfect: newFoundWords.length === puzzle.valid_compounds.length,
          allMundart: totalMundart > 0 && foundMundart === totalMundart,
        });
        triggerAccountPrompt(readStreak('zaemesetzli').current);
        setTimeout(() => { void checkAchievements(); }, 0);
      }
      clearGameProgress('zaemesetzli');
    }

    const newFoundExtras: FoundCompound[] = extras.map((c) => ({ ...c, foundAt: now }));

    set({
      foundWords: newFoundWords,
      score: newScore,
      currentRank: newRank,
      selectedEmojis: [],
      lastResult: primary.is_mundart ? 'mundart' : 'valid',
      lastResultId: get().lastResultId + 1,
      lastFoundCompound: {
        components: primary.components,
        word: primary.word,
        points: primary.points,
        is_mundart: primary.is_mundart,
      },
      lastExtraFound: newFoundExtras,
      status: allFound ? 'complete' : 'playing',
      ...streakUpdate,
    });

    // Persist after finding a word (if still playing)
    if (!allFound) {
      persistZaemesetzli(get());
    }
  },

  finishGame: () => {
    const { puzzle, foundWords, score, currentRank, status, isArchive } = get();
    if (!puzzle || status !== 'playing' || foundWords.length === 0) return;

    const streakUpdate = !isArchive
      ? (() => {
          const rankLabel = currentRank.charAt(0).toUpperCase() + currentRank.slice(1);
          const totalMundart = puzzle.valid_compounds.filter((c) => c.is_mundart).length;
          const foundMundart = foundWords.filter((c) => c.is_mundart).length;
          const streak = completeGame({
            gameType: 'zaemesetzli',
            score,
            elapsed: null,
            dailyResult: {
              outcome: 'complete',
              summary: `${foundWords.length}/${puzzle.valid_compounds.length} · ${rankLabel}`,
              perfect: foundWords.length === puzzle.valid_compounds.length,
              allMundart: totalMundart > 0 && foundMundart === totalMundart,
            },
          });
          return { streak };
        })()
      : {};

    trackGameCompleted('zaemesetzli', 'complete', isArchive, score);

    clearGameProgress('zaemesetzli');

    set({
      status: 'finished',
      selectedEmojis: [],
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
    const newHintsUsed = hintsUsed + 1;
    trackZaemesetzliHintUsed(newHintsUsed);
    set({
      hintsUsed: newHintsUsed,
      score: Math.max(0, score - 1),
      selectedEmojis: hint.components,
    });
    persistZaemesetzli(get());
    return `${hint.components.join(' + ')} = ?`;
  },
}));
