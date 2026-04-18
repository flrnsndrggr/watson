import { useEffect } from 'react';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { ErrorDots } from '@/components/shared/ErrorDots';
import { PuzzleLoading } from '@/components/shared/PuzzleLoading';
import { NewPuzzleBanner } from '@/components/shared/NewPuzzleBanner';
import { useDailyReset } from '@/lib/useDailyReset';
import { HeadlineCard } from './HeadlineCard';
import { SchlagziilResult } from './SchlagziilResult';
import { useSchlagziil } from './useSchlagziil';

export function SchlagziilPage() {
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
    submitGuess,
    advanceToNext,
    useHint,
  } = useSchlagziil();

  const { isStale, refresh } = useDailyReset(puzzle?.date ?? null, loadPuzzle);

  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  useEffect(() => {
    if (lastGuessResult === 'correct') {
      const timer = setTimeout(advanceToNext, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastGuessResult, advanceToNext]);

  if (!puzzle) return <PuzzleLoading />;

  const headline = puzzle.headlines[currentIndex];
  const isFinished = status === 'finished';

  return (
    <GameShell>
      {isStale && <NewPuzzleBanner onRefresh={refresh} />}
      <GameHeader
        title="Schlagziil"
        puzzleNumber={1}
        subtitle="Errate das fehlende Wort"
      />

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
          />
        </>
      )}

      {isFinished && (
        <div className="flex flex-col gap-3">
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

      <SchlagziilResult />
    </GameShell>
  );
}
