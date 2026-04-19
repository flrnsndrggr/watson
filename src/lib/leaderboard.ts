import { supabase, getTodayDateCET } from './supabase';
import type { GameType } from '@/types';

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
  gameType: GameType,
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
  gameType: GameType,
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
