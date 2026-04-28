import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { getTodayDateCET } from '@/lib/dateUtils';

const DISMISSED_KEY_PREFIX = 'watson_banner_dismissed_';

function readDismissed(puzzleDate: string | null): boolean {
  if (!puzzleDate) return false;
  try {
    return sessionStorage.getItem(DISMISSED_KEY_PREFIX + puzzleDate) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(puzzleDate: string): void {
  try {
    sessionStorage.setItem(DISMISSED_KEY_PREFIX + puzzleDate, '1');
  } catch {
    // sessionStorage unavailable (private mode, quota) — silent fail
  }
}

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

  // Track whether the user already clicked "Spielen" and no newer puzzle was found.
  // Persisted to sessionStorage keyed by puzzle date so the banner stays
  // dismissed across navigation within the same browser session — but
  // re-appears for a genuinely new puzzle date.
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed(puzzleDate));

  // Re-sync dismissal when the puzzle date changes (load completes, midnight
  // rollover, archive nav). A different date may already be marked dismissed
  // from an earlier visit, or may be fresh.
  useEffect(() => {
    setDismissed(readDismissed(puzzleDate));
  }, [puzzleDate]);

  // Derive staleness from props + rollover flag (no setState in effect needed)
  const isStale = useMemo(() => {
    if (!puzzleDate) return false;
    if (dismissed) return false;
    if (rolledOver) return true;
    return puzzleDate !== getTodayDateCET();
  }, [puzzleDate, rolledOver, dismissed]);

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
      setDismissed(false);
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
        setDismissed(false);
        setRolledOver(true);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [puzzleDate]);

  const refresh = useCallback(() => {
    // Persist dismissal for the current puzzle date so the banner doesn't
    // immediately re-appear if loadPuzzle returns a puzzle with the same date
    // (e.g. no fresh puzzle is published in the DB yet).
    if (puzzleDate) writeDismissed(puzzleDate);
    setDismissed(true);
    setRolledOver(false);
    onRefresh();
  }, [onRefresh, puzzleDate]);

  return { isStale, refresh };
}
