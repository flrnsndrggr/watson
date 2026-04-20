import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { ErrorDots } from '@/components/shared/ErrorDots';
import { PuzzleLoading } from '@/components/shared/PuzzleLoading';
import { NewPuzzleBanner } from '@/components/shared/NewPuzzleBanner';
import { ArchiveBanner } from '@/components/shared/ArchiveBanner';
import { HowToPlayModal } from '@/components/shared/HowToPlayModal';
import { hasSeenHowToPlay } from '@/lib/howToPlayStorage';
import { VERBINDIGE_STEPS } from '@/lib/howToPlayContent';
import { useDailyReset } from '@/lib/useDailyReset';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { useStreak } from '@/lib/useStreak';
import { VerbindigeBoard } from './VerbindigeBoard';
import { VerbindigeResult } from './VerbindigeResult';
import { useVerbindige } from './useVerbindige';

export function VerbindigePage() {
  const [searchParams] = useSearchParams();
  const archiveDate = searchParams.get('date');

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
    pendingCorrect,
    isArchive,
  } = useVerbindige();

  const reducedMotion = usePrefersReducedMotion();
  const { current: streak, recordPlay } = useStreak('verbindige');
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
    loadPuzzle(archiveDate ?? undefined);
    if (!hasSeenHowToPlay('verbindige')) {
      setShowHowToPlay(true);
    }
  }, [loadPuzzle, archiveDate]);

  // Reset reveal state when a new puzzle loads
  useEffect(() => {
    if (status === 'playing') {
      setRevealComplete(false);
    }
  }, [status]);

  // Keyboard support
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (status !== 'playing' || pendingCorrect != null) return;
    if (e.key === 'Enter' && selected.length === 4) {
      submitGuess();
    } else if (e.key === 'Backspace') {
      clearSelection();
    }
  }, [status, pendingCorrect, selected.length, submitGuess, clearSelection]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
  // Show results immediately on win, but wait for staggered reveal on loss
  const showResult = status === 'won' || (status === 'lost' && revealComplete);

  return (
    <GameShell>
      {isArchive && <ArchiveBanner date={puzzle?.date ?? archiveDate ?? ''} />}
      {!isArchive && isStale && <NewPuzzleBanner onRefresh={refresh} />}
      <GameHeader
        title="Verbindige"
        puzzleId={puzzle?.date ?? ''}
        subtitle="Finde 4 Gruppen à 4"
        onInfoClick={() => setShowHowToPlay(true)}
        streak={streak}
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
              disabled={shufflePhase !== 'idle' || pendingCorrect != null}
              className="rounded border border-[var(--color-gray-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-black)] transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              Mischen
            </button>
            <button
              onClick={clearSelection}
              disabled={selected.length === 0 || pendingCorrect != null}
              className="rounded border border-[var(--color-gray-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-black)] transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              Löschen
            </button>
            <button
              onClick={submitGuess}
              disabled={selected.length !== 4 || pendingCorrect != null}
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
