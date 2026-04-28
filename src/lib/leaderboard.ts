import { supabase, getTodayDateCET } from './supabase';
import type { LeaderboardGameType } from '@/types';

export interface LeaderboardEntry {
  display_name: string;
  score: number;
  time_seconds: number | null;
  is_current_user: boolean;
}

/** Mask an email for public display: "max@example.com" → "ma***" */
export function maskEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  if (local.length <= 2) return local + '***';
  return local.slice(0, 2) + '***';
}

/**
 * Submit a leaderboard entry for the current user.
 * Uses upsert — safe to call multiple times per day.
 */
export async function submitLeaderboardEntry(
  gameType: LeaderboardGameType,
  score: number,
  timeSeconds: number | null,
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const puzzleDate = getTodayDateCET();
    const displayName = maskEmail(user.email ?? 'anon');

    await supabase
      .from('leaderboard_entries')
      .upsert(
        {
          user_id: user.id,
          game_type: gameType,
          puzzle_date: puzzleDate,
          score,
          time_seconds: timeSeconds,
          display_name: displayName,
        },
        { onConflict: 'user_id,game_type,puzzle_date' },
      );
  } catch {
    // Silently fail — leaderboard is non-critical
  }
}

/**
 * Fetch today's leaderboard for a game.
 * Returns top 10 entries + the current user's entry/rank if outside top 10.
 */
export async function fetchLeaderboard(
  gameType: LeaderboardGameType,
  puzzleDate?: string,
): Promise<{ entries: LeaderboardEntry[]; userRank: number | null }> {
  try {
    const date = puzzleDate ?? getTodayDateCET();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? null;

    // Fetch top 10 by score DESC, time ASC (lower time = better)
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('user_id, display_name, score, time_seconds')
      .eq('game_type', gameType)
      .eq('puzzle_date', date)
      .order('score', { ascending: false })
      .order('time_seconds', { ascending: true, nullsFirst: false })
      .limit(10);

    if (error || !data) return { entries: [], userRank: null };

    const entries: LeaderboardEntry[] = data.map((row) => ({
      display_name: row.display_name as string,
      score: row.score as number,
      time_seconds: row.time_seconds as number | null,
      is_current_user: row.user_id === userId,
    }));

    // Check if current user is in top 10
    let userRank: number | null = null;
    const userInTop = entries.findIndex((e) => e.is_current_user);

    if (userInTop >= 0) {
      userRank = userInTop + 1;
    } else if (userId) {
      // User not in top 10 — find their entry and rank
      const { data: userEntry } = await supabase
        .from('leaderboard_entries')
        .select('score, time_seconds')
        .eq('user_id', userId)
        .eq('game_type', gameType)
        .eq('puzzle_date', date)
        .maybeSingle();

      if (userEntry) {
        const { count: aboveCount } = await supabase
          .from('leaderboard_entries')
          .select('id', { count: 'exact', head: true })
          .eq('game_type', gameType)
          .eq('puzzle_date', date)
          .gt('score', userEntry.score as number);

        userRank = (aboveCount ?? 0) + 1;

        entries.push({
          display_name: maskEmail(user?.email ?? 'anon'),
          score: userEntry.score as number,
          time_seconds: userEntry.time_seconds as number | null,
          is_current_user: true,
        });
      }
    }

    return { entries, userRank };
  } catch {
    return { entries: [], userRank: null };
  }
}

// ===== Period leaderboards (week / month / all-time) =====

export type LeaderboardPeriod = 'today' | 'week' | 'month' | 'all';

export interface LeaderboardSummaryEntry {
  display_name: string;
  total_score: number;
  plays: number;
  is_current_user: boolean;
  rank: number;
}

export interface LeaderboardSummary {
  entries: LeaderboardSummaryEntry[];
  totalParticipants: number;
  userRank: number | null;
  userPercentile: number | null;
}

/** Returns YYYY-MM-DD for "N days ago" in Europe/Zurich. */
function cetDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toLocaleDateString('sv-SE', {
    timeZone: 'Europe/Zurich',
  });
}

function periodWindow(period: LeaderboardPeriod): { start: string; end: string } {
  const today = getTodayDateCET();
  if (period === 'today') return { start: today, end: today };
  if (period === 'week') return { start: cetDaysAgo(6), end: today };
  if (period === 'month') return { start: cetDaysAgo(29), end: today };
  // 'all' — start of unix epoch is fine; puzzle_date is text so we need a
  // sortable lower bound that precedes any real puzzle date.
  return { start: '1970-01-01', end: today };
}

/**
 * Fetch the period leaderboard via the get_leaderboard_summary RPC.
 * Sums score across the window; ties broken by play count, then by rank
 * order returned by the SQL window function.
 */
export async function fetchLeaderboardSummary(
  gameType: LeaderboardGameType,
  period: LeaderboardPeriod,
  limit: number = 10,
): Promise<LeaderboardSummary> {
  try {
    const { start, end } = periodWindow(period);

    const [{ data: rows }, { data: total }] = await Promise.all([
      supabase.rpc('get_leaderboard_summary', {
        p_game_type: gameType,
        p_start_date: start,
        p_end_date: end,
        p_limit: limit,
      }),
      supabase.rpc('get_leaderboard_total', {
        p_game_type: gameType,
        p_start_date: start,
        p_end_date: end,
      }),
    ]);

    const entries: LeaderboardSummaryEntry[] = (rows ?? []).map((r: {
      display_name: string;
      total_score: number | string;
      plays: number | string;
      is_current_user: boolean;
      rank: number | string;
    }) => ({
      display_name: r.display_name,
      total_score: Number(r.total_score),
      plays: Number(r.plays),
      is_current_user: r.is_current_user,
      rank: Number(r.rank),
    }));

    const totalParticipants = Number(total ?? 0);
    const me = entries.find((e) => e.is_current_user);
    const userRank = me?.rank ?? null;
    const userPercentile =
      userRank && totalParticipants > 0
        ? Math.max(1, Math.round((userRank / totalParticipants) * 100))
        : null;

    return { entries, totalParticipants, userRank, userPercentile };
  } catch {
    return { entries: [], totalParticipants: 0, userRank: null, userPercentile: null };
  }
}
