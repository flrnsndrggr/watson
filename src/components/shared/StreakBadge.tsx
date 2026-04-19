import type { StreakData } from '@/types';

interface StreakBadgeProps {
  streak: StreakData;
}

/**
 * Displays the current streak as a flame icon + count.
 * Only renders when there's an active streak (current >= 1).
 */
export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak.current < 1) return null;

  const isMilestone = streak.current >= 7;
  const isHot = streak.current >= 3;

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gray-bg)] px-3 py-1"
      aria-label={`Streak: ${streak.current} ${streak.current === 1 ? 'Tag' : 'Tage'}`}
    >
      <span
        className={`text-base transition-transform ${isMilestone ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''}`}
        aria-hidden
      >
        {isHot ? '🔥' : '✨'}
      </span>
      <span className="text-sm font-bold text-[var(--color-black)]">
        {streak.current}
      </span>
      <span className="text-xs text-[var(--color-gray-text)]">
        {streak.current === 1 ? 'Tag' : 'Tage'}
      </span>
      {streak.current === streak.longest && streak.longest > 1 && (
        <span className="text-xs text-[var(--color-pink)] font-semibold">
          Rekord!
        </span>
      )}
    </div>
  );
}
