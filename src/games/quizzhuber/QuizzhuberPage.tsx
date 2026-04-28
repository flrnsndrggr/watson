import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { useQuizzhuber } from './useQuizzhuber';
import { QuizzhuberResult } from './QuizzhuberResult';

export function QuizzhuberPage() {
  const [params] = useSearchParams();
  const archiveDate = params.get('date') ?? undefined;
  const {
    puzzle,
    currentIndex,
    answers,
    status,
    loadPuzzle,
    selectAnswer,
    next,
  } = useQuizzhuber();

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
        <QuizzhuberResult />
      </GameShell>
    );
  }

  const q = puzzle.questions[currentIndex];
  const selected = answers[currentIndex];
  const total = puzzle.questions.length;
  const isLast = currentIndex >= total - 1;

  return (
    <GameShell>
      <GameHeader
        title="Quizzhuber"
        puzzleId={String(puzzle.episode)}
        subtitle={puzzle.intro}
      />

      {/* Progress dots */}
      <div className="mb-4 flex items-center justify-center gap-1.5" aria-label={`Frage ${currentIndex + 1} von ${total}`}>
        {puzzle.questions.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              answers[i] !== null
                ? 'bg-[var(--color-cyan)]'
                : i === currentIndex
                  ? 'bg-[var(--color-pink)]'
                  : 'bg-[var(--color-gray-bg)]'
            }`}
          />
        ))}
      </div>

      <div className="rounded-lg border-2 border-[var(--color-gray-bg)] p-4">
        {q.category && (
          <span className="inline-block rounded bg-[var(--color-gray-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-gray-text)]">
            {q.category}
          </span>
        )}
        <h2 className="mt-2 font-[family-name:var(--font-heading)] text-lg font-bold leading-snug">
          {currentIndex + 1}. {q.prompt}
        </h2>

        <div className="mt-4 flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === q.correct_index;
            const showResult = selected !== null;
            let cls = 'border-[var(--color-gray-bg)] hover:border-[var(--color-cyan)]';
            if (showResult && isCorrect) {
              cls = 'border-[var(--color-green)] bg-[var(--color-green)]/[0.08]';
            } else if (showResult && isSelected && !isCorrect) {
              cls = 'border-[var(--color-pink)] bg-[var(--color-pink)]/[0.08]';
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectAnswer(i)}
                disabled={selected !== null}
                className={`min-h-[44px] rounded-lg border-2 px-3 py-2 text-left text-sm font-semibold transition-colors disabled:cursor-default ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {selected !== null && q.explanation && (
          <p className="mt-3 rounded bg-[var(--color-surface-soft,var(--color-gray-bg))] p-3 text-xs text-[var(--color-black)]">
            {q.explanation}
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={next}
          disabled={selected === null}
          className="min-h-[44px] rounded bg-[var(--color-cyan)] px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isLast ? 'Auflösen' : 'Weiter →'}
        </button>
      </div>
    </GameShell>
  );
}
