import type { GameType } from '@/types';
import { getTodayDateCET } from '@/lib/supabase';

export interface DailyResult {
  outcome: 'won' | 'lost' | 'complete';
  summary: string;
  emojiLine?: string;
  timeSeconds?: number | null;
}

interface DailyResultsStore {
  date: string;
  results: Partial<Record<GameType, DailyResult>>;
}

const STORAGE_KEY = 'watson_daily_results';

function load(): DailyResultsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: '', results: {} };
    return JSON.parse(raw) as DailyResultsStore;
  } catch {
    return { date: '', results: {} };
  }
}

function save(store: DailyResultsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Save a game result for today. Auto-resets if date has changed.
 * Safe to call multiple times — overwrites previous result for the same game.
 */
export function saveDailyResult(game: GameType, result: DailyResult): void {
  const today = getTodayDateCET();
  const store = load();

  // Reset if day has changed
  if (store.date !== today) {
    store.date = today;
    store.results = {};
  }

  store.results[game] = result;
  save(store);
}

/**
 * Get all daily results for today. Returns empty results if date is stale.
 */
export function getDailyResults(): DailyResultsStore {
  const today = getTodayDateCET();
  const store = load();

  if (store.date !== today) {
    return { date: today, results: {} };
  }

  return store;
}
