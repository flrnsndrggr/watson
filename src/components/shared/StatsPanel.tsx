import { useState } from 'react';
import type { GameStats } from '@/lib/gameStats';

interface StatsPanelProps {
  stats: GameStats;
  /** Label for the distribution section (e.g., "Fehler-Verteilung") */
  distributionLabel: string;
}

function StatBox({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-[family-name:var(--font-heading)] text-xl font-bold leading-none">
        {value}
      </span>
      <span className="text-[10px] leading-tight text-[var(--color-gray-text)]">
        {label}
      </span>
    </div>
  );
}

export function StatsPanel({ stats, distributionLabel }: StatsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  // Don't render if no games played yet
  if (stats.played === 0) return null;

  const maxCount = Math.max(...stats.distribution.map((b) => b.count), 1);

  return (
    <div className="mt-5 animate-[resultSlideUp_400ms_ease-out_600ms_both]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="mx-auto flex items-center gap-1 text-xs text-[var(--color-gray-text)] hover:text-[var(--color-cyan)]"
      >
        {expanded ? 'Statistik ausblenden' : 'Deine Statistik'}
        <span
          className={`inline-block transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          &#x25BE;
        </span>
      </button>

      {expanded && (
        <div className="mt-3 animate-[resultSlideUp_300ms_ease-out]">
          {/* Summary row */}
          <div className="flex items-center justify-center gap-5">
            <StatBox value={stats.played} label="Gespielt" />
            <StatBox value={`${stats.winPct}%`} label="Gewonnen" />
            <StatBox value={stats.currentStreak} label="Streak" />
            <StatBox value={stats.maxStreak} label="Max" />
          </div>

          {/* Distribution chart */}
          <div className="mt-4">
            <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-gray-text)]">
              {distributionLabel}
            </p>
            <div className="flex flex-col gap-1">
              {stats.distribution.map((bucket) => {
                const widthPct = maxCount > 0
                  ? Math.max((bucket.count / maxCount) * 100, bucket.count > 0 ? 8 : 0)
                  : 0;

                return (
                  <div key={bucket.label} className="flex items-center gap-2">
                    <span className="w-[72px] shrink-0 text-right text-xs text-[var(--color-gray-text)]">
                      {bucket.label}
                    </span>
                    <div className="flex flex-1 items-center">
                      <div
                        className={`flex h-5 items-center justify-end rounded-sm px-1.5 text-[10px] font-bold text-white transition-all ${
                          bucket.isToday
                            ? 'bg-[var(--color-cyan)]'
                            : bucket.count > 0
                              ? 'bg-[var(--color-nav-bg)]'
                              : 'bg-[var(--color-gray-bg)]'
                        }`}
                        style={{
                          width: bucket.count > 0 ? `${widthPct}%` : '20px',
                          animationName: 'statsBarGrow',
                          animationDuration: '500ms',
                          animationTimingFunction: 'ease-out',
                          animationFillMode: 'both',
                        }}
                      >
                        <span className={bucket.count === 0 ? 'text-[var(--color-gray-text)]' : ''}>
                          {bucket.count}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
