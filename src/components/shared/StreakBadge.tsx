import type { StreakData } from '@/types';

interface StreakBadgeProps {
  streak: StreakData;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak.current < 1) return null;

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-1.5 rounded-full bg-[var(--color-pink)]/10 px-3 py-1.5"
        aria-label={`Aktuelle Serie: ${streak.current} ${streak.current === 1 ? 'Tag' : 'Tage'}`}
      >
        <span className="text-xs text-[var(--color-pink)]/70">Serie</span>
        <span className="text-lg" role="img" aria-hidden="true">🔥</span>
        <span className="text-sm font-semibold text-[var(--color-pink)]">
          {streak.current} {streak.current === 1 ? 'Tag' : 'Tage'}
        </span>
      </div>
      {streak.longest > streak.current && (
        <span className="text-xs text-[var(--color-gray-text)]">
          Rekord: {streak.longest}
        </span>
      )}
    </div>
  );
}
