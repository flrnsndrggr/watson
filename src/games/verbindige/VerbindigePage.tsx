import { useEffect } from 'react';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { ErrorDots } from '@/components/shared/ErrorDots';
import { showToast } from '@/components/shared/Toast';
import { VerbindigeBoard } from './VerbindigeBoard';
import { VerbindigeResult } from './VerbindigeResult';
import { useVerbindige } from './useVerbindige';
import confetti from 'canvas-confetti';

export function VerbindigePage() {
  const {
    loadPuzzle,
    status,
    selected,
    submitGuess,
    clearSelection,
    mistakes,
    maxMistakes,
    lastGuessResult,
  } = useVerbindige();

  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  useEffect(() => {
    if (lastGuessResult === 'one-away') {
      showToast('Fast! Nur 1 falsch.');
    }
  }, [lastGuessResult]);

  useEffect(() => {
    if (status === 'won') {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, [status]);

  const isPlaying = status === 'playing';

  return (
    <GameShell>
      <GameHeader
        title="Verbindige"
        puzzleNumber={1}
        subtitle="Finde 4 Gruppen à 4"
      />

      <VerbindigeBoard />

      {isPlaying && (
        <div className="mt-4 flex items-center justify-between">
          <ErrorDots total={maxMistakes} used={mistakes} />
          <div className="flex gap-2">
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
