import { useEffect, useRef, useState } from 'react';
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

/** Animated counter that counts up/down to the target value. */
function useAnimatedScore(target: number): number {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    const duration = 400; // ms
    startRef.current = null;

    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - t) * (1 - t);
      const current = Math.round(from + (target - from) * eased);
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return display;
}

export function RankBar({ currentRank, score, maxScore, thresholds }: RankBarProps) {
  const displayScore = useAnimatedScore(score);
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
        <span
          key={score}
          className={`text-[var(--color-gray-text)] tabular-nums ${
            score > 0 ? 'animate-[scorePop_350ms_ease]' : ''
          }`}
        >
          {nextRank && pointsToNext > 0
            ? `${displayScore} Pkt · noch ${thresholds[nextRank] - displayScore} bis ${RANK_LABELS[nextRank]}`
            : `${displayScore}/${maxScore} Pkt`}
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
