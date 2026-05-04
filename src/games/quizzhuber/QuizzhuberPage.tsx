import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { useQuizzhuber } from './useQuizzhuber';
import { QuizzhuberResult } from './QuizzhuberResult';

type CardPhase = 'entering' | 'visible' | 'exiting';

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

  const [cardPhase, setCardPhase] = useState<CardPhase>('entering');
  const [shakeCard, setShakeCard] = useState(false);
  const [latestDotIndex, setLatestDotIndex] = useState<number | null>(null);
  const prevIndexRef = useRef(currentIndex);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    void loadPuzzle(archiveDate);
  }, [loadPuzzle, archiveDate]);

  // Confetti on good finish (8+ correct out of 10)
  useEffect(() => {
    if (status === 'finished' && prevStatusRef.current !== 'finished' && puzzle) {
      const correct = puzzle.questions.reduce(
        (sum, q, i) => sum + (answers[i] === q.correct_index ? 1 : 0),
        0,
      );
      if (correct >= 8) {
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        });
      }
    }
    prevStatusRef.current = status;
  }, [status, puzzle, answers]);

  // When currentIndex changes (question advanced), trigger enter animation
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      setCardPhase('entering');
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex]);

  // Clear enter animation after it plays
  useEffect(() => {
    if (cardPhase === 'entering') {
      const id = setTimeout(() => setCardPhase('visible'), 400);
      return () => clearTimeout(id);
    }
  }, [cardPhase]);

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (!puzzle) return;
      const q = puzzle.questions[currentIndex];
      selectAnswer(optionIndex);
      setLatestDotIndex(currentIndex);

      // Shake the card if wrong
      if (optionIndex !== q.correct_index) {
        setShakeCard(true);
        setTimeout(() => setShakeCard(false), 400);
      }
    },
    [puzzle, currentIndex, selectAnswer],
  );

  const handleNext = useCallback(() => {
    // Exit animation, then advance
    setCardPhase('exiting');
    setTimeout(() => {
      next();
      // enter animation triggered by the currentIndex effect
    }, 350);
  }, [next]);

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

  const cardAnimClass =
    cardPhase === 'entering'
      ? 'animate-[cardEnter_400ms_ease-out]'
      : cardPhase === 'exiting'
        ? 'animate-[cardExit_350ms_ease-in_forwards]'
        : '';

  return (
    <GameShell>
      <GameHeader
        title="Quizz den Huber"
        puzzleId={String(puzzle.episode)}
        subtitle={puzzle.intro}
      />

      {/* Progress dots */}
      <div className="mb-4 flex items-center justify-center gap-1.5" aria-label={`Frage ${currentIndex + 1} von ${total}`}>
        {puzzle.questions.map((_, i) => {
          const isAnswered = answers[i] !== null;
          const isCurrent = i === currentIndex;
          const isLatestDot = i === latestDotIndex;
          return (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                isAnswered
                  ? 'bg-[var(--color-cyan)]'
                  : isCurrent
                    ? 'bg-[var(--color-pink)]'
                    : 'bg-[var(--color-gray-bg)]'
              } ${isLatestDot && isAnswered ? 'animate-[dotPulse_400ms_ease-out]' : ''}`}
            />
          );
        })}
      </div>

      <div
        className={`rounded-lg border-2 border-[var(--color-gray-bg)] p-4 ${cardAnimClass} ${shakeCard ? 'animate-[shake_400ms_ease]' : ''}`}
      >
        {q.category && (
          <span className="inline-block rounded bg-[var(--color-gray-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-gray-text)]">
            {q.category}
          </span>
        )}
        {q.image_url && (
          <img
            src={q.image_url}
            alt={q.image_alt ?? ''}
            className="mt-2 max-h-48 w-full rounded-lg border border-[var(--color-gray-bg)] bg-[var(--color-gray-bg)]/30 object-contain"
          />
        )}
        <h2 className="mt-2 font-[family-name:var(--font-heading)] text-lg font-bold leading-snug">
          {currentIndex + 1}. {q.prompt}
        </h2>

        <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Antwortmöglichkeiten">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === q.correct_index;
            const showResult = selected !== null;

            let cls = 'border-[var(--color-gray-bg)] hover:border-[var(--color-cyan)]';
            let animCls = '';
            if (showResult && isCorrect) {
              cls = 'border-[var(--color-green)] bg-[var(--color-green)]/[0.08]';
              animCls = 'animate-[correctPulse_600ms_ease-out]';
            } else if (showResult && isSelected && !isCorrect) {
              cls = 'border-[var(--color-pink)] bg-[var(--color-pink)]/[0.08]';
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(i)}
                disabled={selected !== null}
                aria-pressed={isSelected}
                className={`relative min-h-[44px] rounded-lg border-2 px-3 py-2 text-left text-sm font-semibold transition-colors disabled:cursor-default ${cls} ${animCls}`}
              >
                <span>{opt}</span>
                {showResult && isCorrect && (
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-green)] animate-[checkPop_400ms_ease-out]"
                    aria-label="Richtig"
                  >
                    ✓
                  </span>
                )}
                {showResult && isSelected && !isCorrect && (
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-pink)] animate-[checkPop_400ms_ease-out]"
                    aria-label="Falsch"
                  >
                    ✗
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selected !== null && q.explanation && (
          <p className="mt-3 animate-[cardEnter_400ms_ease-out] rounded bg-[var(--color-surface-soft,var(--color-gray-bg))] p-3 text-xs text-[var(--color-black)]">
            {q.explanation}
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          disabled={selected === null}
          className="min-h-[44px] rounded bg-[var(--color-cyan)] px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isLast ? 'Auflösen' : 'Weiter →'}
        </button>
      </div>
    </GameShell>
  );
}
