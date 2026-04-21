import type { GameType } from '@/types';
import { getPlayHistory, type DailyResult } from '@/lib/dailyResults';
import { getStreak } from '@/lib/streaks';

// ===== Stats shape =====

export interface DistributionBucket {
  label: string;
  count: number;
  /** Whether this bucket matches today's result */
  isToday: boolean;
}

export interface GameStats {
  played: number;
  won: number;
  winPct: number;
  currentStreak: number;
  maxStreak: number;
  distribution: DistributionBucket[];
}

// ===== Parsers per game =====

/**
 * Verbindige summary: "1/4 Fehler 23s" (won) or "Knapp daneben 45s" (lost)
 * Returns mistakes count (0-3) or 'lost'.
 */
function parseVerbindigeBucket(result: DailyResult): string {
  if (result.outcome === 'lost') return 'lost';
  const match = result.summary.match(/^(\d)\/4/);
  if (match) return match[1];
  return '0';
}

/**
 * Schlagziil summary: "4/5"
 * Returns correct count as string.
 */
function parseSchlagziilBucket(result: DailyResult): string {
  const match = result.summary.match(/^(\d)\/5/);
  if (match) return match[1];
  return result.outcome === 'lost' ? '0' : '5';
}

/**
 * Zaemesetzli summary: "8/12 · Meister"
 * Returns the rank name.
 */
function parseZaemesetzliBucket(result: DailyResult): string {
  const rankMatch = result.summary.match(/·\s*(\w+)$/);
  if (rankMatch) return rankMatch[1].toLowerCase();
  // Fallback: if summary is just "Komplett" or similar
  if (result.outcome === 'complete' && !result.summary.includes('·')) return 'complete';
  return 'stift';
}

// ===== Distribution templates =====

const VERBINDIGE_BUCKETS = [
  { key: '0', label: '0 Fehler' },
  { key: '1', label: '1 Fehler' },
  { key: '2', label: '2 Fehler' },
  { key: '3', label: '3 Fehler' },
  { key: 'lost', label: 'Verloren' },
];

const SCHLAGZIIL_BUCKETS = [
  { key: '5', label: '5/5' },
  { key: '4', label: '4/5' },
  { key: '3', label: '3/5' },
  { key: '2', label: '2/5' },
  { key: '1', label: '1/5' },
  { key: '0', label: '0/5' },
];

const ZAEMESETZLI_BUCKETS = [
  { key: 'bundesrat', label: 'Bundesrat' },
  { key: 'meister', label: 'Meister' },
  { key: 'geselle', label: 'Geselle' },
  { key: 'lehrling', label: 'Lehrling' },
  { key: 'stift', label: 'Stift' },
];

// ===== Main computation =====

type BucketParser = (result: DailyResult) => string;
type BucketTemplate = { key: string; label: string }[];

const PARSERS: Record<GameType, BucketParser> = {
  verbindige: parseVerbindigeBucket,
  schlagziil: parseSchlagziilBucket,
  zaemesetzli: parseZaemesetzliBucket,
};

const TEMPLATES: Record<GameType, BucketTemplate> = {
  verbindige: VERBINDIGE_BUCKETS,
  schlagziil: SCHLAGZIIL_BUCKETS,
  zaemesetzli: ZAEMESETZLI_BUCKETS,
};

/**
 * Compute aggregate statistics for a game from the rolling play history.
 * Optionally pass `todayBucket` to highlight today's result in the distribution.
 */
export function computeGameStats(
  gameType: GameType,
  todayBucket?: string,
): GameStats {
  const history = getPlayHistory();
  const streak = getStreak(gameType);
  const parser = PARSERS[gameType];
  const template = TEMPLATES[gameType];

  // Count results per bucket
  const counts: Record<string, number> = {};
  for (const t of template) counts[t.key] = 0;

  let played = 0;
  let won = 0;

  for (const dayResults of Object.values(history)) {
    const result = dayResults[gameType];
    if (!result) continue;

    played++;
    if (result.outcome !== 'lost') won++;

    const bucket = parser(result);
    if (bucket in counts) {
      counts[bucket]++;
    }
  }

  const distribution: DistributionBucket[] = template.map((t) => ({
    label: t.label,
    count: counts[t.key],
    isToday: todayBucket === t.key,
  }));

  return {
    played,
    won,
    winPct: played > 0 ? Math.round((won / played) * 100) : 0,
    currentStreak: streak.current,
    maxStreak: streak.longest,
    distribution,
  };
}
