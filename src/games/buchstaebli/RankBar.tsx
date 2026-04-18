import type { Rank, RankThresholds } from '@/types';

const RANK_LABELS: Record<Rank, string> = {
  stift: 'Stift',
  lehrling: 'Lehrling',
  geselle: 'Geselle',
  meister: 'Meister',
  bundesrat: 'Bundesrat',
};

const RANK_ORDER: Rank[] = ['stift', 'lehrling', 'geselle', 'meister', 'bundesrat'];

interface RankBarProps {
  currentRank: Rank;
  score: number;
  maxScore: number;
  thresholds: RankThresholds;
}

export function RankBar({ currentRank, score, maxScore, thresholds }: RankBarProps) {
  const pct = Math.min(100, Math.round((score / maxScore) * 100));

  const tickMarks = RANK_ORDER
    .filter((rank) => thresholds[rank] > 0)
    .map((rank) => ({
      rank,
      pct: Math.round((thresholds[rank] / maxScore) * 100),
    }));

  const currentRankIdx = RANK_ORDER.indexOf(currentRank);
  const nextRank = currentRankIdx < RANK_ORDER.length - 1 ? RANK_ORDER[currentRankIdx + 1] : null;
  const pointsToNext = nextRank ? thresholds[nextRank] - score : 0;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{RANK_LABELS[currentRank]}</span>
        <span className="text-[var(--color-gray-text)]">
          {nextRank && pointsToNext > 0
            ? `noch ${pointsToNext} Pkt bis ${RANK_LABELS[nextRank]}`
            : `${score}/${maxScore} Pkt`}
        </span>
      </div>
      <div className="relative mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--color-gray-bg)]">
        <div
          className="h-full rounded-full bg-[var(--color-cyan)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
        {tickMarks.map(({ rank, pct: tickPct }) => (
          <div
            key={rank}
            className="absolute top-0 h-full w-0.5 bg-white/60"
            style={{ left: `${tickPct}%` }}
          />
        ))}
      </div>
    </div>
  );
}
