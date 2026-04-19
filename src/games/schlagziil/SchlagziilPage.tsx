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
  } = useSchlagziil();

  const { isStale, refresh } = useDailyReset(puzzle?.date ?? null, loadPuzzle);
  const [shaking, setShaking] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const prevStatus = useRef(status);

  useEffect(() => {
    loadPuzzle(archiveDate ?? undefined);
    if (!hasSeenHowToPlay('schlagziil')) {
      setShowHowToPlay(true);
    }
  }, [loadPuzzle, archiveDate]);

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
      const shakeTimer = setTimeout(() => setShaking(false), 400);

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
  }, [lastGuessResult, advanceToNext, totalErrors, maxErrors]);

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

  if (!puzzle) return <PuzzleLoading />;

  const headline = puzzle.headlines[currentIndex];
  const isFinished = status === 'finished';

  return (
    <GameShell>
      {isArchive && <ArchiveBanner date={puzzle?.date ?? archiveDate ?? ''} />}
      {!isArchive && isStale && <NewPuzzleBanner onRefresh={refresh} />}
      <GameHeader
        title="Schlagziil"
        puzzleNumber={1}
        subtitle="Errate das fehlende Wort"
        onInfoClick={() => setShowHowToPlay(true)}
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
                  className={`h-2.5 w-2.5 rounded-full ${
                    results[i] === 'correct'
                      ? 'bg-[var(--color-green)]'
                      : results[i] === 'wrong'
                        ? 'bg-[var(--color-pink)]'
                        : i === currentIndex
                          ? 'bg-[var(--color-cyan)]'
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

      {/* Results summary first — share button visible without scrolling */}
      {isFinished && <SchlagziilResult />}

      {/* Headline review — expandable section below results */}
      {isFinished && (
        <div className="mt-6 animate-[resultSlideUp_400ms_ease-out_1000ms_both]">
          <button
            onClick={() => setReviewExpanded(!reviewExpanded)}
            className="flex w-full items-center justify-between rounded-lg border-2 border-[var(--color-gray-bg)] px-4 py-3 text-left transition-colors hover:border-[var(--color-cyan)]"
            aria-expanded={reviewExpanded}
            aria-controls="headline-review"
          >
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden>📰</span>
              <span className="text-sm font-semibold">
                Alle Schlagzeilen anzeigen
              </span>
            </div>
            <span
              className={`text-sm text-[var(--color-gray-text)] transition-transform ${reviewExpanded ? 'rotate-180' : ''}`}
              aria-hidden
            >
              ▼
            </span>
          </button>

          {reviewExpanded && (
            <div
              id="headline-review"
              className="mt-3 flex flex-col gap-3 animate-[resultSlideUp_300ms_ease-out]"
            >
              {puzzle.headlines.map((h, i) => (
                <HeadlineCard
                  key={i}
                  display={h.display}
                  category={h.category}
                  articleYear={h.article_year}
                  articleDate={h.article_date}
                  articleUrl={h.article_url}
                  contextHint={h.context_hint}
                  onSubmit={() => {}}
                  isCorrect={results[i] === 'correct'}
                  revealedAnswer={revealedAnswers[i]}
                  disabled
                  hintUsed={hintsUsed[i]}
                  onUseHint={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </GameShell>
  );
}
