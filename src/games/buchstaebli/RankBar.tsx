import type { Rank, BuchstaebliPuzzle } from '@/types';

const RANK_LABELS: Record<Rank, string> = {
  stift: 'Stift',
  lehrling: 'Lehrling',
  geselle: 'Geselle',
  meister: 'Meister',
  bundesrat: 'Bundesrat',
};

interface RankBarProps {
  currentRank: Rank;
  score: number;
  maxScore: number;
  thresholds: BuchstaebliPuzzle['rank_thresholds'];
}

export function RankBar({ currentRank, score, maxScore }: RankBarProps) {
  const pct = Math.min(100, Math.round((score / maxScore) * 100));

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{RANK_LABELS[currentRank]}</span>
        <span className="text-[var(--color-gray-text)]">{score}/{maxScore} Pkt</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--color-gray-bg)]">
        <div
          className="h-full rounded-full bg-[var(--color-cyan)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
