import { useCallback, useEffect, useState } from 'react';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { ErrorDots } from '@/components/shared/ErrorDots';
import { PuzzleLoading } from '@/components/shared/PuzzleLoading';
import { NewPuzzleBanner } from '@/components/shared/NewPuzzleBanner';
import { useDailyReset } from '@/lib/useDailyReset';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { useStreak } from '@/lib/useStreak';
import { VerbindigeBoard } from './VerbindigeBoard';
import { VerbindigeResult } from './VerbindigeResult';
import { useVerbindige } from './useVerbindige';

export function VerbindigePage() {
  const {
    loadPuzzle,
    puzzle,
    status,
    selected,
    submitGuess,
    clearSelection,
    shuffleRemaining,
    mistakes,
    maxMistakes,
  } = useVerbindige();

  const reducedMotion = usePrefersReducedMotion();
  const { current: streak, recordPlay } = useStreak('verbindige');
  const [shufflePhase, setShufflePhase] = useState<'idle' | 'out' | 'in'>('idle');

  const handleShuffle = useCallback(() => {
    if (shufflePhase !== 'idle') return;
    clearSelection();
    setShufflePhase('out');
    setTimeout(() => {
      shuffleRemaining();
      setShufflePhase('in');
      setTimeout(() => setShufflePhase('idle'), 300);
    }, 300);
  }, [shufflePhase, clearSelection, shuffleRemaining]);

  const { isStale, refresh } = useDailyReset(puzzle?.date ?? null, loadPuzzle);

  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  useEffect(() => {
    if ((status === 'won' || status === 'lost') && puzzle?.date) {
      recordPlay(puzzle.date);
    }
  }, [status, puzzle?.date, recordPlay]);

  useEffect(() => {
    if (status === 'won' && !reducedMotion) {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      });
    }
  }, [status, reducedMotion]);

  if (status === 'loading') return <PuzzleLoading />;

  const isPlaying = status === 'playing';

  return (
    <GameShell>
      {isStale && <NewPuzzleBanner onRefresh={refresh} />}
      <GameHeader
        title="Verbindige"
        puzzleId={puzzle?.date ?? ''}
        subtitle="Finde 4 Gruppen à 4"
        streak={streak}
      />

      <VerbindigeBoard shufflePhase={shufflePhase} />

      {isPlaying && (
        <div className="mt-4 flex items-center justify-between">
          <ErrorDots total={maxMistakes} used={mistakes} />
          <div className="flex gap-2">
            <button
              onClick={handleShuffle}
              disabled={shufflePhase !== 'idle'}
              className="rounded border border-[var(--color-gray-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-black)] transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              Mischen
            </button>
            <button
              onClick={clearSelection}
              disabled={selected.length === 0}
              className="rounded border border-[var(--color-gray-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-black)] transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              Löschen
            </button>
            <button
              onClick={submitGuess}
              disabled={selected.length !== 4}
              className="rounded bg-[var(--color-cyan)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              Prüfen
            </button>
          </div>
        </div>
      )}

      <VerbindigeResult />
    </GameShell>
  );
}
