import { useAufgedeckt } from './useAufgedeckt';
import { ShareButton } from '@/components/shared/ShareButton';
import { LeaderboardPanel } from '@/components/shared/LeaderboardPanel';
import { generateShareText } from '@/lib/share';
import { StreakBadge } from '@/components/shared/StreakBadge';

export function AufgedecktResult() {
  const { puzzle, results, totalRevealed, streak } = useAufgedeckt();
  if (!puzzle) return null;

  const correct = results.filter((r) => r === 'correct').length;
  const total = puzzle.rounds.length;
  const beatThreshold = totalRevealed < puzzle.threshold;
  const verdict =
    correct === total
      ? 'Alle erkannt!'
      : correct >= total - 2
        ? 'Knapp am perfekten Run.'
        : correct >= total / 2
          ? 'Ordentlich.'
          : 'Beim nächsten Mal mehr Felder.';

  const emojiLine = results
    .map((r) => (r === 'correct' ? '🟩' : '🟥'))
    .join('');

  const shareText = generateShareText(
    'verbindige',
    puzzle.date ?? puzzle.episode,
    `Aufgedeckt #${puzzle.episode} — ${correct}/${total} (${totalRevealed} Felder)\n${emojiLine}`,
  );

  return (
    <div className="text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold">
        Aufgedeckt #{puzzle.episode}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-gray-text)]">{verdict}</p>

      <div className="mt-4">
        <span className="font-[family-name:var(--font-heading)] text-5xl font-black">
          {correct}
        </span>
        <span className="text-2xl text-[var(--color-gray-text)]">/{total}</span>
      </div>
      <p className="mt-1 text-xs text-[var(--color-gray-text)]">
        <span className="font-bold text-[var(--color-black)]">{totalRevealed}</span>{' '}
        Felder aufgedeckt
        {beatThreshold && <span className="ml-2 text-[var(--color-green)]">— unter dem Ziel von {puzzle.threshold}!</span>}
      </p>

      {streak.current >= 1 && (
        <div className="mt-4 flex justify-center">
          <StreakBadge streak={streak} />
        </div>
      )}

      {/* Round-by-round summary */}
      <div className="mt-6 grid grid-cols-2 gap-2 text-left sm:grid-cols-3" role="list">
        {puzzle.rounds.map((r, i) => (
          <div
            key={i}
            className={`rounded-lg border-2 p-2 ${
              results[i] === 'correct'
                ? 'border-[var(--color-green)]/40 bg-[var(--color-green)]/[0.04]'
                : 'border-[var(--color-pink)]/40 bg-[var(--color-pink)]/[0.04]'
            }`}
          >
            <img src={r.image_url} alt={r.answer} className="h-24 w-full rounded object-cover" />
            <p className="mt-1 text-xs font-semibold">{r.answer}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-center">
        <ShareButton text={shareText} label="Ergebnis teilen" game="verbindige" />
      </div>

      <LeaderboardPanel gameType="aufgedeckt" puzzleDate={puzzle.date} />
    </div>
  );
}
