import type { GameType } from '@/types';

export const STREAK_MILESTONE_EVENT = 'watson:streak-milestone';

export interface StreakMilestoneDetail {
  game: GameType;
  streak: number;
  /** Whether a Joker was earned at this milestone. */
  jokerEarned: boolean;
  /** Current Joker bank after earning (only meaningful when jokerEarned). */
  jokersBanked: number;
}

/** Dispatch a streak milestone celebration event (consumed by StreakMilestoneCelebrationHost). */
export function dispatchStreakMilestone(detail: StreakMilestoneDetail): void {
  window.dispatchEvent(
    new CustomEvent<StreakMilestoneDetail>(STREAK_MILESTONE_EVENT, { detail }),
  );
}
