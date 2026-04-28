import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { useAufgedeckt } from './useAufgedeckt';
import { AufgedecktResult } from './AufgedecktResult';

const DEFAULT_COLS = 5;
const DEFAULT_ROWS = 5;

export function AufgedecktPage() {
  const [params] = useSearchParams();
  const archiveDate = params.get('date') ?? undefined;
  const {
    puzzle,
    currentIndex,
    revealedTiles,
    results,
    totalRevealed,
    status,
    loadPuzzle,
    revealTile,
    submitGuess,
    skipRound,
    next,
  } = useAufgedeckt();

  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<'wrong' | null>(null);

  useEffect(() => {
    void loadPuzzle(archiveDate);
  }, [loadPuzzle, archiveDate]);

  // Clear input on round change
  useEffect(() => {
    setGuess('');
    setFeedback(null);
  }, [currentIndex]);

  if (!puzzle || status === 'loading') {
    return (
      <GameShell>
        <div className="mt-12 text-center text-sm text-[var(--color-gray-text)]">Lade …</div>
      </GameShell>
    );
  }

  if (status === 'finished') {
    return (
      <GameShell>
        <AufgedecktResult />
      </GameShell>
    );
  }

  const round = puzzle.rounds[currentIndex];
  const cols = round.cols ?? DEFAULT_COLS;
  const rows = round.rows ?? DEFAULT_ROWS;
  const tilesTotal = cols * rows;
  const revealed = new Set(revealedTiles[currentIndex] ?? []);
  const result = results[currentIndex];
  const total = puzzle.rounds.length;
  const isLast = currentIndex >= total - 1;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = submitGuess(guess);
    if (!ok) {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 600);
    }
  }

  return (
    <GameShell>
      <GameHeader title="Aufgedeckt" puzzleId={String(puzzle.episode)} />

      {/* Round stripe */}
      <div className="mb-3 flex items-center justify-between text-xs text-[var(--color-gray-text)]">
        <span>Runde {currentIndex + 1} / {total}</span>
        <span>{totalRevealed} Felder aufgedeckt</span>
      </div>

      {/* Image with tile grid overlay */}
      <div className="relative mx-auto overflow-hidden rounded-lg border-2 border-[var(--color-gray-bg)] bg-[var(--color-gray-bg)]" style={{ aspectRatio: `${cols} / ${rows}` }}>
        <img
          src={round.image_url}
          alt={result ? round.answer : 'Verstecktes Bild'}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {!result && (
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
            aria-label="Felder"
          >
            {Array.from({ length: tilesTotal }, (_, i) => {
              const isRevealed = revealed.has(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => revealTile(i)}
                  disabled={isRevealed}
                  className={`border border-white/20 transition-opacity ${
                    isRevealed ? 'opacity-0' : 'bg-[var(--color-nav-bg)] hover:opacity-90'
                  }`}
                  aria-label={isRevealed ? 'Feld aufgedeckt' : `Feld ${i + 1} aufdecken`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Hint */}
      {round.hint && revealed.size >= Math.floor(tilesTotal / 2) && !result && (
        <p className="mt-2 text-center text-xs text-[var(--color-gray-text)]">
          💡 {round.hint}
        </p>
      )}

      {/* Guess form / next button */}
      {!result ? (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Was ist es?"
            className={`flex-1 min-h-[44px] rounded border-2 px-3 text-sm transition-colors focus:outline-none ${
              feedback === 'wrong'
                ? 'border-[var(--color-pink)] animate-[shake_400ms_ease]'
                : 'border-[var(--color-gray-bg)] focus:border-[var(--color-cyan)]'
            }`}
          />
          <button
            type="submit"
            disabled={!guess.trim()}
            className="min-h-[44px] rounded bg-[var(--color-cyan)] px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Prüfen
          </button>
          <button
            type="button"
            onClick={skipRound}
            className="min-h-[44px] rounded border border-[var(--color-gray-bg)] px-3 text-sm font-semibold text-[var(--color-gray-text)] transition-colors hover:bg-[var(--color-gray-bg)]"
          >
            Aufgeben
          </button>
        </form>
      ) : (
        <div className="mt-4 rounded-lg border-2 p-3 text-center" style={{
          borderColor: result === 'correct' ? 'var(--color-green)' : 'var(--color-pink)',
          backgroundColor: result === 'correct' ? 'rgba(123,212,0,0.06)' : 'rgba(244,15,151,0.06)',
        }}>
          <p className="text-sm">
            {result === 'correct' ? '✓ Richtig:' : '✗ Auflösung:'}{' '}
            <span className="font-bold">{round.answer}</span>
          </p>
          <button
            type="button"
            onClick={next}
            className="mt-3 min-h-[44px] rounded bg-[var(--color-cyan)] px-5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            {isLast ? 'Auflösen' : 'Nächste Runde →'}
          </button>
        </div>
      )}
    </GameShell>
  );
}
