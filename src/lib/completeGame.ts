import type { GameType, LeaderboardGameType, StreakData } from '@/types';
import type { DailyResult } from '@/lib/dailyResults';
import { recordGamePlayed } from '@/lib/streaks';
import { submitLeaderboardEntry } from '@/lib/leaderboard';
import { checkStreakMilestone } from '@/lib/analytics';
import { saveDailyResult } from '@/lib/dailyResults';
import { triggerAccountPrompt } from '@/components/shared/AccountPromptHost';
import { checkAchievements } from '@/lib/achievements';

export interface GameCompletionParams {
  gameType: GameType;
  /** Override for games with leaderboard variants (e.g. schlagloch_rueckblick). */
  leaderboardType?: LeaderboardGameType;
  score: number;
  elapsed: number | null;
  dailyResult: DailyResult;
}

/**
 * Shared game completion chain: record streak, submit leaderboard entry,
 * trigger account prompt, check achievements, and save daily result.
 *
 * Call `clearGameProgress(gameType)` separately — it runs unconditionally
 * (including archive mode) in each game hook.
 */
export function completeGame({
  gameType,
  leaderboardType,
  score,
  elapsed,
  dailyResult,
}: GameCompletionParams): StreakData {
  const streak = recordGamePlayed(gameType);
  checkStreakMilestone(gameType, streak.current);
  void submitLeaderboardEntry(leaderboardType ?? gameType, score, elapsed);
  triggerAccountPrompt(streak.current);
  setTimeout(() => { void checkAchievements(); }, 0);
  saveDailyResult(gameType, dailyResult);
  return streak;
}
