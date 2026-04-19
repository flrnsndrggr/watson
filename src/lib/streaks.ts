import type { GameType, StreakData } from '@/types';
import { getTodayDateCET } from '@/lib/supabase';

const STORAGE_KEY = 'watson_streaks';

type StreakStore = Partial<Record<GameType, StreakData>>;

function loadStreaks(): StreakStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StreakStore;
  } catch {
    return {};
  }
}

function saveStreaks(store: StreakStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/** Returns yesterday's date in YYYY-MM-DD (Europe/Zurich). */
function getYesterdayDateCET(): string {
  const now = new Date();
  // Create a date object for "now" in Zurich, then subtract one day
  const yesterday = new Date(now.getTime() - 86_400_000);
  return yesterday.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
}

/**
 * Get the current streak data for a game.
 * If the streak is stale (last_played is older than yesterday), resets current to 0.
 */
export function getStreak(gameType: GameType): StreakData {
  const store = loadStreaks();
  const data = store[gameType];

  if (!data) {
    return { current: 0, longest: 0, last_played: '' };
  }

  const today = getTodayDateCET();
  const yesterday = getYesterdayDateCET();

  // Streak is still alive if played today or yesterday
  if (data.last_played === today || data.last_played === yesterday) {
    return data;
  }

  // Streak is broken — return with current reset
  return { current: 0, longest: data.longest, last_played: data.last_played };
}

/**
 * Record that a game was played today. Updates current streak + longest streak.
 * Returns the updated streak data.
 *
 * Safe to call multiple times per day — only increments once.
 */
export function recordGamePlayed(gameType: GameType): StreakData {
  const store = loadStreaks();
  const existing = store[gameType];
  const today = getTodayDateCET();
  const yesterday = getYesterdayDateCET();

  // Already recorded today — return current data
  if (existing?.last_played === today) {
    return existing;
  }

  let newCurrent: number;

  if (existing && existing.last_played === yesterday) {
    // Continuing a streak
    newCurrent = existing.current + 1;
  } else {
    // Starting fresh (no data, or gap > 1 day)
    newCurrent = 1;
  }

  const longestSoFar = existing?.longest ?? 0;
  const newLongest = Math.max(longestSoFar, newCurrent);

  const updated: StreakData = {
    current: newCurrent,
    longest: newLongest,
    last_played: today,
  };

  store[gameType] = updated;
  saveStreaks(store);

  return updated;
}
