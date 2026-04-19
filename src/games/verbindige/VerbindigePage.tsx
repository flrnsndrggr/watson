import { useCallback, useEffect, useState } from 'react';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { ErrorDots } from '@/components/shared/ErrorDots';
import { PuzzleLoading } from '@/components/shared/PuzzleLoading';
import { NewPuzzleBanner } from '@/components/shared/NewPuzzleBanner';
import { HowToPlayModal } from '@/components/shared/HowToPlayModal';
import { hasSeenHowToPlay } from '@/lib/howToPlayStorage';
import { VERBINDIGE_STEPS } from '@/lib/howToPlayContent';
import { useDailyReset } from '@/lib/useDailyReset';
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

  const [shufflePhase, setShufflePhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [revealComplete, setRevealComplete] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

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

  const handleRevealComplete = useCallback(() => {
    setRevealComplete(true);
  }, []);

  const { isStale, refresh } = useDailyReset(puzzle?.date ?? null, loadPuzzle);

  useEffect(() => {
    loadPuzzle();
    if (!hasSeenHowToPlay('verbindige')) {
      setShowHowToPlay(true);
    }
  }, [loadPuzzle]);

  // Reset reveal state when a new puzzle loads
  useEffect(() => {
    if (status === 'playing') {
      setRevealComplete(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'won') {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      });
    }
  }, [status]);

  if (status === 'loading') return <PuzzleLoading />;

  const isPlaying = status === 'playing';
  // Show results immediately on win, but wait for staggered reveal on loss
  const showResult = status === 'won' || (status === 'lost' && revealComplete);

  return (
    <GameShell>
      {isStale && <NewPuzzleBanner onRefresh={refresh} />}
      <GameHeader
        title="Verbindige"
        puzzleNumber={1}
        subtitle="Finde 4 Gruppen à 4"
        onInfoClick={() => setShowHowToPlay(true)}
      />

      {showHowToPlay && (
        <HowToPlayModal
          gameId="verbindige"
          title="Verbindige"
          steps={VERBINDIGE_STEPS}
          onClose={() => setShowHowToPlay(false)}
        />
      )}

      <VerbindigeBoard
        shufflePhase={shufflePhase}
        onRevealComplete={handleRevealComplete}
      />

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

      {showResult && <VerbindigeResult />}
    </GameShell>
  );
}
