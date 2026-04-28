import type { GameType } from '@/types';
import { getTodayDateCET } from '@/lib/dateUtils';

/**
 * Persist and restore in-progress game state via localStorage.
 *
 * Key design:
 * - Keyed by game + puzzle ID + today's CET date (auto-expires at midnight)
 * - Only persists for today's puzzle (not archive)
 * - Cleared on game completion (won/lost/finished)
 * - Transient UI state (selections, animations) is NOT persisted
 */

const STORAGE_PREFIX = 'watson_progress_';

function storageKey(game: GameType): string {
  return `${STORAGE_PREFIX}${game}`;
}

interface PersistedEnvelope<T> {
  puzzleId: string;
  date: string;
  state: T;
  savedAt: number;
}

/**
 * Save in-progress game state. Only call for today's (non-archive) puzzles.
 */
export function saveGameProgress<T>(game: GameType, puzzleId: string, state: T): void {
  try {
    const envelope: PersistedEnvelope<T> = {
      puzzleId,
      date: getTodayDateCET(),
      state,
      savedAt: Date.now(),
    };
    localStorage.setItem(storageKey(game), JSON.stringify(envelope));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

/**
 * Load saved game state. Returns null if:
 * - No saved state exists
 * - Saved state is for a different puzzle or date
 * - Data is corrupted
 */
export function loadGameProgress<T>(game: GameType, puzzleId: string): T | null {
  try {
    const raw = localStorage.getItem(storageKey(game));
    if (!raw) return null;

    const envelope = JSON.parse(raw) as PersistedEnvelope<T>;

    // Validate: same puzzle, same day
    if (envelope.puzzleId !== puzzleId || envelope.date !== getTodayDateCET()) {
      clearGameProgress(game);
      return null;
    }

    return envelope.state;
  } catch {
    clearGameProgress(game);
    return null;
  }
}

/**
 * Clear saved state (call on game completion or new puzzle load).
 */
export function clearGameProgress(game: GameType): void {
  try {
    localStorage.removeItem(storageKey(game));
  } catch {
    // silent fail
  }
}
