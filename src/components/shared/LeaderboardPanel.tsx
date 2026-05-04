import { useEffect, useState } from 'react';
import {
  fetchLeaderboard,
  fetchLeaderboardSummary,
  type LeaderboardEntry,
  type LeaderboardSummary,
  type LeaderboardSummaryEntry,
  type LeaderboardPeriod,
} from '@/lib/leaderboard';
import { logEvent } from '@/lib/events';
import type { LeaderboardGameType } from '@/types';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

interface LeaderboardPanelProps {
  gameType: LeaderboardGameType;
  puzzleDate?: string;
  /** Whether this game uses time as a ranking factor (Today tab only) */
  showTime?: boolean;
}

const TABS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'today', label: 'Heute' },
  { id: 'week', label: 'Woche' },
  { id: 'month', label: 'Monat' },
  { id: 'all', label: 'Allzeit' },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function LeaderboardPanel({ gameType, puzzleDate, showTime }: LeaderboardPanelProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('today');

  return (
    <div
      className="mt-5 rounded-lg border-2 border-[var(--color-gray-bg)] p-4 animate-[resultSlideUp_400ms_ease-out_600ms_both]"
      role="region"
      aria-label="Rangliste"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-black)]">
          Rangliste
        </h3>
        <div className="flex gap-1" role="tablist" aria-label="Zeitraum">
          {TABS.map((t) => {
            const active = period === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setPeriod(t.id);
                  void logEvent('leaderboard_tab_viewed', {
                    gameType,
                    payload: { period: t.id },
                  });
                }}
                className={`rounded-full px-2.5 py-1 min-h-[44px] text-[11px] font-bold transition-colors ${
                  active
                    ? 'bg-[var(--color-cyan)] text-white'
                    : 'bg-[var(--color-gray-bg)] text-[var(--color-gray-text)] hover:text-[var(--color-black)]'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {period === 'today' ? (
        <DailyBody
          key={`d:${gameType}:${puzzleDate ?? 'today'}`}
          gameType={gameType}
          puzzleDate={puzzleDate}
          showTime={showTime}
        />
      ) : (
        <PeriodBody
          key={`p:${gameType}:${period}`}
          gameType={gameType}
          period={period}
        />
      )}
    </div>
  );
}

// ===== Today (single-puzzle) =====

function DailyBody({
  gameType,
  puzzleDate,
  showTime,
}: {
  gameType: LeaderboardGameType;
  puzzleDate?: string;
  showTime?: boolean;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Param changes are handled by the parent re-keying us so loading=true on
  // mount is the natural state; this effect only ever flips loading→false.
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

  if (loading) return <SkeletonRows />;
  if (entries.length === 0) return <EmptyState />;

  const topEntries = entries.filter((e, i) => i < 10 || !e.is_current_user);
  const userOutsideTop =
    userRank && userRank > 10 ? entries.find((e) => e.is_current_user) : null;

  return (
    <div className="mt-2 divide-y divide-[var(--color-gray-bg)]">
      {topEntries.slice(0, 10).map((entry, i) => (
        <DailyRow key={i} rank={i + 1} entry={entry} showTime={showTime} />
      ))}
      {userOutsideTop && (
        <>
          <div className="flex items-center gap-1 py-1">
            <span className="text-[10px] text-[var(--color-gray-text)]">···</span>
          </div>
          <DailyRow rank={userRank!} entry={userOutsideTop} showTime={showTime} />
        </>
      )}
    </div>
  );
}

function DailyRow({
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

// ===== Period (week / month / all-time) =====

function PeriodBody({
  gameType,
  period,
}: {
  gameType: LeaderboardGameType;
  period: LeaderboardPeriod;
}) {
  const [data, setData] = useState<LeaderboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Same pattern as DailyBody: parent re-keys when params change, so initial
  // loading=true is naturally correct and the effect only flips to false.
  useEffect(() => {
    let cancelled = false;
    fetchLeaderboardSummary(gameType, period).then((res) => {
      if (cancelled) return;
      setData(res);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [gameType, period]);

  if (loading) return <SkeletonRows />;
  if (!data || data.entries.length === 0) return <EmptyState />;

  // Top entries are the rows where rank ≤ 10. The viewer's own row appears
  // at the end with rank > 10 if they exist outside the top.
  const top = data.entries.filter((e) => e.rank <= 10);
  const me = data.entries.find((e) => e.is_current_user && e.rank > 10) ?? null;

  return (
    <>
      <div className="mt-2 divide-y divide-[var(--color-gray-bg)]">
        {top.map((entry) => (
          <PeriodRow key={entry.rank} entry={entry} />
        ))}
        {me && (
          <>
            <div className="flex items-center gap-1 py-1">
              <span className="text-[10px] text-[var(--color-gray-text)]">···</span>
            </div>
            <PeriodRow entry={me} />
          </>
        )}
      </div>

      {data.userRank && data.totalParticipants > 0 && (
        <p className="mt-3 text-center text-[11px] text-[var(--color-gray-text)]">
          Du:{' '}
          <span className="font-bold text-[var(--color-cyan)]">
            #{data.userRank} von {data.totalParticipants}
          </span>
          {data.userPercentile !== null && data.userPercentile <= 50 && (
            <> {' '}— Top {data.userPercentile}%</>
          )}
        </p>
      )}
      {!data.userRank && data.totalParticipants > 0 && (
        <p className="mt-3 text-center text-[11px] text-[var(--color-gray-text)]">
          {data.totalParticipants}{' '}
          {data.totalParticipants === 1 ? 'Teilnehmer' : 'Teilnehmer/innen'}
          {' · '}
          Melde dich an, um zu rangieren.
        </p>
      )}
    </>
  );
}

function PeriodRow({ entry }: { entry: LeaderboardSummaryEntry }) {
  const medal = entry.rank <= 3 ? RANK_MEDALS[entry.rank - 1] : null;
  return (
    <div
      className={`flex items-center gap-2 py-1.5 text-sm ${
        entry.is_current_user
          ? 'font-semibold text-[var(--color-cyan)]'
          : 'text-[var(--color-black)]'
      }`}
    >
      <span className="w-6 shrink-0 text-center text-xs" aria-label={`Rang ${entry.rank}`}>
        {medal ?? entry.rank}
      </span>
      <span className="flex-1 truncate">
        {entry.display_name}
        {entry.is_current_user && (
          <span className="ml-1 text-[10px] text-[var(--color-gray-text)]">(du)</span>
        )}
      </span>
      <span className="shrink-0 tabular-nums text-xs font-semibold">
        {entry.total_score}
      </span>
      <span className="shrink-0 text-[10px] text-[var(--color-gray-text)] tabular-nums">
        {entry.plays}×
      </span>
    </div>
  );
}

// ===== Shared =====

function SkeletonRows() {
  return (
    <div className="mt-3 space-y-2">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-8 animate-pulse rounded bg-[var(--color-gray-bg)]" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <p className="mt-3 text-center text-xs text-[var(--color-gray-text)]">
      Noch keine Einträge. Melde dich an, um auf der Rangliste zu erscheinen!
    </p>
  );
}
