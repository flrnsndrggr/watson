import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { getTodayDateCET } from '@/lib/supabase';

/**
 * Detects midnight CET rollover and signals when a new puzzle is available.
 *
 * @param puzzleDate - The date string (YYYY-MM-DD) of the currently loaded puzzle.
 * @param onRefresh  - Callback to reload the puzzle (typically `loadPuzzle`).
 * @returns `isStale` — true when the loaded puzzle no longer matches today's CET date.
 */
export function useDailyReset(
  puzzleDate: string | null,
  onRefresh: () => void,
) {
  // Track whether a midnight rollover happened while the page was open
  const [rolledOver, setRolledOver] = useState(false);

  // Derive staleness from props + rollover flag (no setState in effect needed)
  const isStale = useMemo(() => {
    if (!puzzleDate) return false;
    if (rolledOver) return true;
    return puzzleDate !== getTodayDateCET();
  }, [puzzleDate, rolledOver]);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Schedule a timer for midnight CET to flip the rollover flag
  useEffect(() => {
    if (!puzzleDate || isStale) return;

    function msUntilMidnightCET(): number {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Zurich',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      }).formatToParts(now);

      const get = (type: string) =>
        Number(parts.find((p) => p.type === type)?.value ?? 0);
      const h = get('hour');
      const m = get('minute');
      const s = get('second');

      const secondsUntilMidnight = (24 - h - 1) * 3600 + (60 - m - 1) * 60 + (60 - s);
      // Add 2s buffer to ensure the date has actually flipped
      return secondsUntilMidnight * 1000 + 2000;
    }

    const ms = msUntilMidnightCET();
    timerRef.current = setTimeout(() => {
      setRolledOver(true);
    }, ms);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [puzzleDate, isStale]);

  // Check on visibility change (user returns to tab after midnight)
  useEffect(() => {
    function handleVisibility() {
      if (!puzzleDate) return;
      if (document.visibilityState === 'visible' && puzzleDate !== getTodayDateCET()) {
        setRolledOver(true);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [puzzleDate]);

  const refresh = useCallback(() => {
    setRolledOver(false);
    onRefresh();
  }, [onRefresh]);

  return { isStale, refresh };
}
