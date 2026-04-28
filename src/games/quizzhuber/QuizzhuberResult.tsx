import { useQuizzhuber } from './useQuizzhuber';
import { ShareButton } from '@/components/shared/ShareButton';
import { LeaderboardPanel } from '@/components/shared/LeaderboardPanel';
import { generateShareText } from '@/lib/share';
import { StreakBadge } from '@/components/shared/StreakBadge';

export function QuizzhuberResult() {
  const { puzzle, answers, streak } = useQuizzhuber();
  if (!puzzle) return null;

  const total = puzzle.questions.length;
  const correct = puzzle.questions.reduce(
    (sum, q, i) => sum + (answers[i] === q.correct_index ? 1 : 0),
    0,
  );
  const pct = Math.round((correct / total) * 100);
  const verdict =
    correct === total
      ? 'Perfekt!'
      : correct >= 8
        ? 'Beachtlich.'
        : correct >= 5
          ? 'Geht so.'
          : 'Nochmals von vorne nächste Woche.';

  const emojiLine = puzzle.questions
    .map((q, i) => (answers[i] === q.correct_index ? '🟩' : '🟥'))
    .join('');

  const shareText = generateShareText(
    'verbindige', // reuse the share-text helper; treats puzzle date as identifier
    puzzle.date ?? puzzle.episode,
    `Quizzhuber #${puzzle.episode} — ${correct}/${total}\n${emojiLine}`,
  );

  return (
    <div className="text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold">
        Quizzhuber #{puzzle.episode}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-gray-text)]">{verdict}</p>

      <div className="mt-4">
        <span className="font-[family-name:var(--font-heading)] text-5xl font-black">
          {correct}
        </span>
        <span className="text-2xl text-[var(--color-gray-text)]">/{total}</span>
      </div>
      <p className="mt-1 text-xs text-[var(--color-gray-text)]">{pct}% richtig</p>

      {streak.current >= 1 && (
        <div className="mt-4 flex justify-center">
          <StreakBadge streak={streak} />
        </div>
      )}

      {/* Per-question review */}
      <div className="mt-6 text-left" role="list" aria-label="Alle Fragen">
        <h2 className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--color-gray-text)]">
          Alle Fragen
        </h2>
        <div className="flex flex-col gap-2">
          {puzzle.questions.map((q, i) => {
            const userIdx = answers[i];
            const isCorrect = userIdx === q.correct_index;
            return (
              <div
                key={i}
                className={`rounded-lg border-2 p-3 ${
                  isCorrect
                    ? 'border-[var(--color-green)]/40 bg-[var(--color-green)]/[0.04]'
                    : 'border-[var(--color-pink)]/40 bg-[var(--color-pink)]/[0.04]'
                }`}
              >
                <p className="text-sm font-semibold">
                  {i + 1}. {q.prompt}
                </p>
                <p className="mt-1 text-xs text-[var(--color-gray-text)]">
                  Richtig:{' '}
                  <span className="font-semibold text-[var(--color-black)]">
                    {q.options[q.correct_index]}
                  </span>
                  {!isCorrect && userIdx !== null && (
                    <>
                      {' · Deine Antwort: '}
                      <span className="text-[var(--color-pink)]">{q.options[userIdx]}</span>
                    </>
                  )}
                </p>
                {q.explanation && (
                  <p className="mt-1 text-xs text-[var(--color-gray-text)]">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <ShareButton text={shareText} label="Ergebnis teilen" game="verbindige" />
      </div>

      <LeaderboardPanel gameType="quizzhuber" puzzleDate={puzzle.date} />
    </div>
  );
}
