/**
 * Streak risk detection. Pure helpers — no React, no IO.
 *
 * "At risk":  streak ≥ 2, not played today, and current CET hour ≥ 18.
 * "Critical": same conditions but CET hour ≥ 22.
 *
 * Hour-of-day is passed in (rather than read here) so the caller can decide
 * the freshness of "now" — keeps these pure and easy to test.
 */
import type { StreakData } from '@/types';
import { getTodayDateCET } from '@/lib/dateUtils';

export type RiskLevel = 'safe' | 'at_risk' | 'critical';

/** Returns the current hour (0–23) in Europe/Zurich. */
export function getCurrentCETHour(): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Zurich',
    hour12: false,
    hour: 'numeric',
  }).formatToParts(now);
  const hourPart = parts.find((p) => p.type === 'hour');
  if (!hourPart) return now.getHours();
  // Intl returns 24 for midnight on some Node versions; normalize to 0.
  const h = parseInt(hourPart.value, 10);
  return h === 24 ? 0 : h;
}

/**
 * Compute risk for a single game's streak.
 *
 * Note: we use the *raw* streak (`getStreakRaw` from streaks.ts) — the
 * displayed `current` is already 0 when the streak has broken; this helper
 * only matters in the "alive but no play today" window.
 */
export function getStreakRiskLevel(
  streak: StreakData,
  hourCET: number = getCurrentCETHour(),
): RiskLevel {
  if (streak.current < 2) return 'safe';
  const today = getTodayDateCET();
  if (streak.last_played === today) return 'safe';
  if (hourCET >= 22) return 'critical';
  if (hourCET >= 18) return 'at_risk';
  return 'safe';
}
