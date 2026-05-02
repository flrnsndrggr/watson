import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { useAufgedeckt } from './useAufgedeckt';
import { AufgedecktResult } from './AufgedecktResult';

const DEFAULT_COLS = 5;
const DEFAULT_ROWS = 5;

export function AufgedecktPage() {
  const [params] = useSearchParams();
  const archiveDate = params.get('date') ?? undefined;
  const reducedMotion = usePrefersReducedMotion();
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

  // Track tiles currently animating their flip
  const [flippingTiles, setFlippingTiles] = useState<Set<number>>(new Set());
  // Track tiles being wave-cleared on correct answer
  const [waveClearTiles, setWaveClearTiles] = useState<Set<number>>(new Set());
  // Track whether we just got a correct answer (for image border pulse)
  const [correctFlash, setCorrectFlash] = useState(false);

  // Reset animation state when round changes
  useEffect(() => {
    setFlippingTiles(new Set());
    setWaveClearTiles(new Set());
    setCorrectFlash(false);
  }, [currentIndex]);

  const handleRevealTile = useCallback((tileIndex: number) => {
    if (reducedMotion) {
      revealTile(tileIndex);
      return;
    }
    // Start flip animation, then actually reveal after it completes
    setFlippingTiles((prev) => new Set(prev).add(tileIndex));
    setTimeout(() => {
      revealTile(tileIndex);
      setFlippingTiles((prev) => {
        const next = new Set(prev);
        next.delete(tileIndex);
        return next;
      });
    }, 300);
  }, [revealTile, reducedMotion]);

  // Wrap submitGuess to trigger wave-clear + confetti on correct
  const handleSubmit = useCallback((guess: string): boolean => {
    const ok = submitGuess(guess);
    if (ok && puzzle) {
      const round = puzzle.rounds[currentIndex];
      const cols = round.cols ?? DEFAULT_COLS;
      const rows = round.rows ?? DEFAULT_ROWS;
      const tilesTotal = cols * rows;
      const revealed = new Set(revealedTiles[currentIndex] ?? []);

      // Green pulse on image container
      setCorrectFlash(true);
      setTimeout(() => setCorrectFlash(false), 800);

      if (!reducedMotion) {
        // Wave-clear remaining tiles with staggered delay
        const remaining = Array.from({ length: tilesTotal }, (_, i) => i)
          .filter((i) => !revealed.has(i));

        remaining.forEach((tileIdx, order) => {
          const delay = order * 40; // 40ms stagger per tile
          setTimeout(() => {
            setWaveClearTiles((prev) => new Set(prev).add(tileIdx));
          }, delay);
        });

        // Confetti after wave starts
        setTimeout(() => {
          void import('canvas-confetti').then(({ default: confetti }) => {
            void confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
          });
        }, 200);
      }
    }
    return ok;
  }, [submitGuess, puzzle, currentIndex, revealedTiles, reducedMotion]);

  useEffect(() => {
    void loadPuzzle(archiveDate);
  }, [loadPuzzle, archiveDate]);

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

  return (
    <GameShell>
      <GameHeader title="Aufgedeckt" puzzleId={String(puzzle.episode)} />

      {/* Round stripe */}
      <div className="mb-3 flex items-center justify-between text-xs text-[var(--color-gray-text)]">
        <span>Runde {currentIndex + 1} / {total}</span>
        <span>{totalRevealed} Felder aufgedeckt</span>
      </div>

      {/* Image with tile grid overlay */}
      <div
        className="relative mx-auto overflow-hidden rounded-lg border-2 border-[var(--color-gray-bg)] bg-[var(--color-gray-bg)]"
        style={{
          aspectRatio: `${cols} / ${rows}`,
          ...(correctFlash ? { animation: 'imageCorrectPulse 800ms ease-out' } : {}),
        }}
      >
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
              perspective: '600px',
            }}
            aria-label="Felder"
          >
            {Array.from({ length: tilesTotal }, (_, i) => {
              const isRevealed = revealed.has(i);
              const isFlipping = flippingTiles.has(i);
              const isWaveClearing = waveClearTiles.has(i);

              if (isRevealed && !isWaveClearing) {
                // Already revealed — invisible placeholder to maintain grid
                return (
                  <div
                    key={i}
                    className="border border-transparent"
                    aria-label="Feld aufgedeckt"
                  />
                );
              }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleRevealTile(i)}
                  disabled={isRevealed || isFlipping || isWaveClearing}
                  className={`border border-white/20 bg-[var(--color-nav-bg)] ${
                    !isFlipping && !isWaveClearing ? 'hover:brightness-125 active:scale-95' : ''
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                    transition: 'transform 0.1s ease, filter 0.15s ease',
                    ...(isFlipping ? {
                      animation: 'tileFlip 300ms ease-in forwards',
                    } : {}),
                    ...(isWaveClearing ? {
                      animation: 'tileWaveClear 400ms ease-in forwards',
                    } : {}),
                  }}
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

      {/* Guess form / next button — re-keyed by round so the input state
          (guess + feedback) resets naturally on advance, no setState-in-effect. */}
      {!result ? (
        <GuessForm
          key={currentIndex}
          onSubmit={handleSubmit}
          onSkip={skipRound}
        />
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

/** Owns its own input + shake-feedback state. Parent re-keys on round change
 *  so React unmounts/remounts and state resets without an effect. */
function GuessForm({
  onSubmit,
  onSkip,
}: {
  onSubmit: (guess: string) => boolean;
  onSkip: () => void;
}) {
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<'wrong' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = onSubmit(guess);
    if (ok) {
      setGuess('');
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 600);
    }
  }

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input
        ref={inputRef}
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
        onClick={onSkip}
        className="min-h-[44px] rounded border border-[var(--color-gray-bg)] px-3 text-sm font-semibold text-[var(--color-gray-text)] transition-colors hover:bg-[var(--color-gray-bg)]"
      >
        Aufgeben
      </button>
    </form>
  );
}
