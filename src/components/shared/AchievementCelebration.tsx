import { useEffect, useState } from 'react';
import {
  ACHIEVEMENT_EVENT_NAME,
  type Achievement,
  type AchievementUnlockedEvent,
} from '@/lib/achievements';

/**
 * Slide-down celebration card shown for ~3.5s when an achievement unlocks.
 * Listens for `watson:achievement-unlocked` so any code path can fire it
 * via the achievements lib without prop drilling.
 */
export function AchievementCelebrationHost() {
  const [queue, setQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AchievementUnlockedEvent>).detail;
      if (!detail) return;
      setQueue((q) => [...q, detail.achievement]);
    };
    window.addEventListener(ACHIEVEMENT_EVENT_NAME, handler);
    return () => window.removeEventListener(ACHIEVEMENT_EVENT_NAME, handler);
  }, []);

  useEffect(() => {
    if (queue.length === 0) return;
    const t = setTimeout(() => {
      setQueue((q) => q.slice(1));
    }, 3500);
    return () => clearTimeout(t);
  }, [queue]);

  if (queue.length === 0) return null;
  const a = queue[0];

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-[100px] z-50 w-[min(360px,calc(100vw-32px))] -translate-x-1/2"
    >
      <div className="pointer-events-auto animate-[popIn_var(--transition-normal)] rounded-lg border-2 border-[var(--color-pink)]/40 bg-white p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-pink)]/10 text-2xl" aria-hidden>
            {a.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-pink)]">
              Erfolg freigeschaltet
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-black)]">
              {a.name}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-gray-text)]">
              {a.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
