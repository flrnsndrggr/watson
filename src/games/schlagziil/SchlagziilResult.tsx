import { ShareButton } from '@/components/shared/ShareButton';
import { PostGameSection } from '@/components/shared/PostGameSection';
import { StreakBadge } from '@/components/shared/StreakBadge';
import { generateShareText } from '@/lib/share';
import { useSchlagziil } from './useSchlagziil';

export function SchlagziilResult() {
  const { results, hintsUsed, puzzle, status, streak } = useSchlagziil();
  if (status !== 'finished' || !puzzle) return null;

  const correctCount = results.filter((r) => r === 'correct').length;

  // Share format: green/red squares grid + CTA
  const accuracyGrid = results
    .map((r, i) => {
      const square = r === 'correct' ? '🟩' : '🟥';
      const hint = hintsUsed[i] ? '💡' : '';
      return `${square}${hint}`;
    })
    .join('');

  const shareText = generateShareText(
    'schlagziil',
    puzzle.date,
    `${correctCount}/5\n${accuracyGrid}\nIch lese watson, und du?`,
  );

  return (
    <div className="mt-6 text-center">
      <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold">
        {correctCount >= 4 ? 'Stark!' : correctCount >= 2 ? 'Nicht schlecht!' : 'Nächstes Mal!'}
      </h2>
      <p className="mt-1 text-[var(--color-gray-text)]">
        {correctCount}/5 Schlagzeilen erraten
      </p>
      <p className="mt-2 text-2xl">
        {accuracyGrid}
      </p>
      {streak.current >= 1 && (
        <div className="mt-3">
          <StreakBadge streak={streak} />
        </div>
      )}
      <div className="mt-4">
        <ShareButton text={shareText} />
      </div>

      <PostGameSection currentGame="schlagziil" />
    </div>
  );
}
