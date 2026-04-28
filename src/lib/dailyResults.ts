import type { GameType } from '@/types';
import { getTodayDateCET } from '@/lib/dateUtils';

export interface DailyResult {
  outcome: 'won' | 'lost' | 'complete';
  summary: string;
  emojiLine?: string;
  timeSeconds?: number | null;
}

/** Per-day results for all games */
export type DayResults = Partial<Record<GameType, DailyResult>>;

/** Legacy format (v1) — date + today's results only */
interface DailyResultsStoreV1 {
  date: string;
  results: DayResults;
}

/** Current format (v2) — rolling history keyed by date string */
interface DailyResultsStoreV2 {
  version: 2;
  history: Record<string, DayResults>;
}

/** Public return type for today's results (backward-compatible) */
interface DailyResultsStore {
  date: string;
  results: DayResults;
}

const STORAGE_KEY = 'watson_daily_results';
const MAX_HISTORY_DAYS = 90;

function isV2(data: unknown): data is DailyResultsStoreV2 {
  return typeof data === 'object' && data !== null && 'version' in data && (data as DailyResultsStoreV2).version === 2;
}

function loadV2(): DailyResultsStoreV2 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 2, history: {} };
    const parsed: unknown = JSON.parse(raw);

    // Already v2
    if (isV2(parsed)) return parsed;

    // Migrate from v1: preserve today's results as a history entry
    const v1 = parsed as DailyResultsStoreV1;
    if (v1.date && v1.results && Object.keys(v1.results).length > 0) {
      return { version: 2, history: { [v1.date]: v1.results } };
    }

    return { version: 2, history: {} };
  } catch {
    return { version: 2, history: {} };
  }
}

function pruneHistory(history: Record<string, DayResults>): Record<string, DayResults> {
  const dates = Object.keys(history).sort();
  if (dates.length <= MAX_HISTORY_DAYS) return history;

  const pruned: Record<string, DayResults> = {};
  const keep = dates.slice(dates.length - MAX_HISTORY_DAYS);
  for (const d of keep) {
    pruned[d] = history[d];
  }
  return pruned;
}

function saveV2(store: DailyResultsStoreV2): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Save a game result for today. Accumulates into rolling 90-day history.
 * Safe to call multiple times — overwrites previous result for the same game on the same day.
 */
export function saveDailyResult(game: GameType, result: DailyResult): void {
  const today = getTodayDateCET();
  const store = loadV2();

  if (!store.history[today]) {
    store.history[today] = {};
  }
  store.history[today][game] = result;

  store.history = pruneHistory(store.history);
  saveV2(store);
}

/**
 * Get all daily results for today. Returns empty results if no data for today.
 */
export function getDailyResults(): DailyResultsStore {
  const today = getTodayDateCET();
  const store = loadV2();

  return {
    date: today,
    results: store.history[today] ?? {},
  };
}

/**
 * Get the full play history (up to 90 days).
 * Returns a map of date string → per-game results.
 */
export function getPlayHistory(): Record<string, DayResults> {
  return loadV2().history;
}
