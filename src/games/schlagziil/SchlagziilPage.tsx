import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { ErrorDots } from '@/components/shared/ErrorDots';
import { PuzzleLoading } from '@/components/shared/PuzzleLoading';
import { NewPuzzleBanner } from '@/components/shared/NewPuzzleBanner';
import { ArchiveBanner } from '@/components/shared/ArchiveBanner';
import { HowToPlayModal } from '@/components/shared/HowToPlayModal';
import { hasSeenHowToPlay } from '@/lib/howToPlayStorage';
import { SCHLAGZIIL_STEPS } from '@/lib/howToPlayContent';
import { showToast } from '@/components/shared/Toast';
import { useDailyReset } from '@/lib/useDailyReset';
import { useStreak } from '@/lib/useStreak';
import { HeadlineCard } from './HeadlineCard';
import { SchlagziilResult } from './SchlagziilResult';
import { useSchlagziil } from './useSchlagziil';

export function SchlagziilPage() {
  const [searchParams] = useSearchParams();
  const archiveDate = searchParams.get('date');

  const {
    loadPuzzle,
    puzzle,
    currentIndex,
    totalErrors,
    maxErrors,
    results,
    revealedAnswers,
    hintsUsed,
    status,
    lastGuessResult,
    isArchive,
    submitGuess,
    advanceToNext,
    useHint,
    clearLastResult,
  } = useSchlagziil();

  const { current: streak, recordPlay } = useStreak('schlagziil');
  const { isStale, refresh } = useDailyReset(puzzle?.date ?? null, loadPuzzle);
  const [shaking, setShaking] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const prevStatus = useRef(status);

  useEffect(() => {
    loadPuzzle(archiveDate ?? undefined);
    if (!hasSeenHowToPlay('schlagziil')) {
      setShowHowToPlay(true);
    }
  }, [loadPuzzle, archiveDate]);

  useEffect(() => {
    if (status === 'finished' && puzzle?.date) {
      recordPlay(puzzle.date);
    }
  }, [status, puzzle?.date, recordPlay]);

  // Handle guess results: toasts, shake, auto-advance
  useEffect(() => {
    if (lastGuessResult === 'correct') {
      showToast('Richtig! ✓');
      const timer = setTimeout(advanceToNext, 2000);
      return () => clearTimeout(timer);
    }

    if (lastGuessResult === 'wrong') {
      // Shake the card
      setShaking(true);
      const shakeTimer = setTimeout(() => {
        setShaking(false);
        clearLastResult();
      }, 400);

      if (totalErrors >= maxErrors) {
        showToast('Keine Versuche mehr!');
      } else {
        const remaining = maxErrors - totalErrors;
        showToast(
          remaining === 1
            ? 'Falsch! Noch 1 Versuch übrig.'
            : `Falsch! Noch ${remaining} Versuche.`,
        );
      }

      return () => clearTimeout(shakeTimer);
    }
  }, [lastGuessResult, advanceToNext, totalErrors, maxErrors, clearLastResult]);

  // Confetti on good finish (4+ correct)
  useEffect(() => {
    if (status === 'finished' && prevStatus.current !== 'finished') {
      const correctCount = results.filter((r) => r === 'correct').length;
      if (correctCount >= 4) {
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        });
      }
    }
    prevStatus.current = status;
  }, [status, results]);

  if (!puzzle) return <PuzzleLoading variant="schlagziil" />;

  const headline = puzzle.headlines[currentIndex];
  const isFinished = status === 'finished';

  return (
    <GameShell>
      {isArchive && <ArchiveBanner date={puzzle?.date ?? archiveDate ?? ''} />}
      {!isArchive && isStale && <NewPuzzleBanner onRefresh={refresh} />}
      <GameHeader
        title="Schlagziil"
        puzzleId={puzzle?.date ?? ''}
        subtitle="Errate das fehlende Wort"
        onInfoClick={() => setShowHowToPlay(true)}
        streak={streak}
      />

      {showHowToPlay && (
        <HowToPlayModal
          gameId="schlagziil"
          title="Schlagziil"
          steps={SCHLAGZIIL_STEPS}
          onClose={() => setShowHowToPlay(false)}
        />
      )}

      {!isFinished && headline && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-1.5">
              {puzzle.headlines.map((_h, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                    results[i] === 'correct'
                      ? 'bg-[var(--color-green)] scale-110'
                      : results[i] === 'wrong'
                        ? 'bg-[var(--color-pink)] scale-110'
                        : i === currentIndex
                          ? 'bg-[var(--color-cyan)] scale-125'
                          : 'bg-[var(--color-gray-bg)]'
                  }`}
                />
              ))}
              <span className="ml-2 text-xs text-[var(--color-gray-text)]">
                Headline {currentIndex + 1}/5
              </span>
            </div>
            <ErrorDots total={maxErrors} used={totalErrors} />
          </div>

          <HeadlineCard
            key={currentIndex}
            display={headline.display}
            category={headline.category}
            articleYear={headline.article_year}
            articleUrl={headline.article_url}
            contextHint={headline.context_hint}
            onSubmit={submitGuess}
            isCorrect={results[currentIndex] === 'correct' ? true : results[currentIndex] === 'wrong' ? false : null}
            revealedAnswer={revealedAnswers[currentIndex]}
            disabled={results[currentIndex] !== null}
            hintUsed={hintsUsed[currentIndex]}
            onUseHint={() => useHint(currentIndex)}
            shaking={shaking}
          />
        </>
      )}

      {/* Results — includes headline review with article links */}
      {isFinished && <SchlagziilResult />}
    </GameShell>
  );
}
