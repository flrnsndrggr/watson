import { useCallback, useEffect, useState } from 'react';
import type { GameType } from '@/types';

interface StreakState {
  current: number;
  lastDate: string | null;
}

function storageKey(gameType: GameType): string {
  return `watson_streak_${gameType}`;
}

function loadStreak(gameType: GameType): StreakState {
  try {
    const raw = localStorage.getItem(storageKey(gameType));
    if (!raw) return { current: 0, lastDate: null };
    return JSON.parse(raw) as StreakState;
  } catch {
    return { current: 0, lastDate: null };
  }
}

function isConsecutiveDay(prev: string, next: string): boolean {
  const prevDate = new Date(prev + 'T00:00:00');
  const nextDate = new Date(next + 'T00:00:00');
  const diff = nextDate.getTime() - prevDate.getTime();
  return diff === 86_400_000; // exactly 1 day in ms
}

export function useStreak(gameType: GameType) {
  const [streak, setStreak] = useState<StreakState>(() => loadStreak(gameType));

  const recordPlay = useCallback((date: string) => {
    setStreak((prev) => {
      if (prev.lastDate === date) return prev; // already recorded today

      let next: StreakState;
      if (prev.lastDate && isConsecutiveDay(prev.lastDate, date)) {
        next = { current: prev.current + 1, lastDate: date };
      } else {
        next = { current: 1, lastDate: date };
      }

      try {
        localStorage.setItem(storageKey(gameType), JSON.stringify(next));
      } catch {
        // Storage unavailable
      }
      return next;
    });
  }, [gameType]);

  // Sync on mount in case another tab updated
  useEffect(() => {
    setStreak(loadStreak(gameType));
  }, [gameType]);

  return { current: streak.current, recordPlay };
}
