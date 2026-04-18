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
  rankUpRank?: Rank | null;
}

export function RankBar({ currentRank, score, maxScore, thresholds, rankUpRank }: RankBarProps) {
  const pct = Math.min(100, Math.round((score / maxScore) * 100));

  // Compute threshold marker positions as percentages
  const markers = RANK_ORDER.slice(1).map((rank) => ({
    rank,
    pct: Math.round((thresholds[rank] / maxScore) * 100),
    reached: score >= thresholds[rank],
  }));

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-sm">
        <span
          key={`rank-${currentRank}`}
          className={`font-bold ${rankUpRank ? 'animate-[popIn_var(--transition-normal)]' : ''} ${
            currentRank === 'bundesrat'
              ? 'text-[var(--color-pink)]'
              : currentRank === 'meister'
                ? 'text-[var(--color-cyan)]'
                : ''
          }`}
        >
          {RANK_LABELS[currentRank]}
        </span>
        <span className="text-[var(--color-gray-text)]">{score}/{maxScore} Pkt</span>
      </div>
      {/* Progress bar with threshold markers */}
      <div className="relative mt-1.5 h-2.5 w-full rounded-full bg-[var(--color-gray-bg)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            currentRank === 'bundesrat'
              ? 'bg-[var(--color-pink)]'
              : 'bg-[var(--color-cyan)]'
          }`}
          style={{ width: `${pct}%` }}
        />
        {/* Threshold dots */}
        {markers.map((m) => (
          <div
            key={m.rank}
            className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-colors duration-300 ${
              m.reached
                ? m.rank === 'bundesrat'
                  ? 'bg-[var(--color-pink)]'
                  : 'bg-[var(--color-cyan)]'
                : 'bg-[var(--color-gray-bg)]'
            }`}
            style={{ left: `${m.pct}%` }}
            title={RANK_LABELS[m.rank]}
          />
        ))}
      </div>
      {/* Rank labels below the bar */}
      <div className="relative mt-1 h-4">
        {markers.map((m) => (
          <span
            key={m.rank}
            className={`absolute -translate-x-1/2 text-[10px] font-semibold transition-colors duration-300 ${
              m.reached ? 'text-[var(--color-black)]' : 'text-[var(--color-gray-text)]'
            }`}
            style={{ left: `${m.pct}%` }}
          >
            {RANK_LABELS[m.rank].charAt(0)}
          </span>
        ))}
      </div>
    </div>
  );
}
