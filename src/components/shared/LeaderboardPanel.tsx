import { useEffect, useState } from 'react';
import { fetchLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard';
import type { LeaderboardGameType } from '@/types';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

interface LeaderboardPanelProps {
  gameType: LeaderboardGameType;
  puzzleDate?: string;
  /** Whether this game uses time as a ranking factor */
  showTime?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function LeaderboardPanel({ gameType, puzzleDate, showTime }: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchLeaderboard(gameType, puzzleDate).then((result) => {
      if (cancelled) return;
      setEntries(result.entries);
      setUserRank(result.userRank);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [gameType, puzzleDate]);

  if (loading) {
    return (
      <div className="mt-5 rounded-lg border-2 border-[var(--color-gray-bg)] p-4">
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--color-gray-bg)]" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-[var(--color-gray-bg)]" />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="mt-5 rounded-lg border-2 border-[var(--color-gray-bg)] p-4 text-center">
        <p className="text-xs text-[var(--color-gray-text)]">
          Noch keine Einträge. Melde dich an, um auf der Rangliste zu erscheinen!
        </p>
      </div>
    );
  }

  // Separate top-10 entries from the user's appended entry (if outside top 10)
  const topEntries = entries.filter((e, i) => i < 10 || !e.is_current_user);
  const userOutsideTop = userRank && userRank > 10
    ? entries.find((e) => e.is_current_user)
    : null;

  return (
    <div
      className="mt-5 rounded-lg border-2 border-[var(--color-gray-bg)] p-4 animate-[resultSlideUp_400ms_ease-out_600ms_both]"
      role="region"
      aria-label="Rangliste"
    >
      <h3 className="font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-black)]">
        Rangliste
      </h3>

      <div className="mt-2 divide-y divide-[var(--color-gray-bg)]">
        {topEntries.slice(0, 10).map((entry, i) => (
          <LeaderboardRow
            key={i}
            rank={i + 1}
            entry={entry}
            showTime={showTime}
          />
        ))}

        {userOutsideTop && (
          <>
            <div className="flex items-center gap-1 py-1">
              <span className="text-[10px] text-[var(--color-gray-text)]">···</span>
            </div>
            <LeaderboardRow
              rank={userRank!}
              entry={userOutsideTop}
              showTime={showTime}
            />
          </>
        )}
      </div>
    </div>
  );
}

function LeaderboardRow({
  rank,
  entry,
  showTime,
}: {
  rank: number;
  entry: LeaderboardEntry;
  showTime?: boolean;
}) {
  const medal = rank <= 3 ? RANK_MEDALS[rank - 1] : null;

  return (
    <div
      className={`flex items-center gap-2 py-1.5 text-sm ${
        entry.is_current_user
          ? 'font-semibold text-[var(--color-cyan)]'
          : 'text-[var(--color-black)]'
      }`}
    >
      <span className="w-6 shrink-0 text-center text-xs" aria-label={`Rang ${rank}`}>
        {medal ?? rank}
      </span>
      <span className="flex-1 truncate">
        {entry.display_name}
        {entry.is_current_user && (
          <span className="ml-1 text-[10px] text-[var(--color-gray-text)]">(du)</span>
        )}
      </span>
      <span className="shrink-0 tabular-nums text-xs font-semibold">
        {entry.score}
      </span>
      {showTime && entry.time_seconds != null && (
        <span className="shrink-0 text-[10px] text-[var(--color-gray-text)] tabular-nums">
          {formatTime(entry.time_seconds)}
        </span>
      )}
    </div>
  );
}
