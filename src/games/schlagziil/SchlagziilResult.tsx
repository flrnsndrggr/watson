import { ShareButton } from '@/components/shared/ShareButton';
import { PostGameSection } from '@/components/shared/PostGameSection';
import { AdSlot } from '@/components/shared/AdSlot';
import { generateShareText } from '@/lib/share';
import { useSchlagziil } from './useSchlagziil';

export function SchlagziilResult() {
  const { results, hintsUsed, puzzle, status } = useSchlagziil();
  if (status !== 'finished' || !puzzle) return null;

  const correctCount = results.filter((r) => r === 'correct').length;

  // v2 share format: "2023 ✓ | 2019 ✓ | 2026 ✗ | 2017 ✓ | 2024 ✓💡"
  const yearLine = puzzle.headlines
    .map((h, i) => {
      const mark = results[i] === 'correct' ? '✓' : '✗';
      const hint = hintsUsed[i] ? '💡' : '';
      return `${h.article_year} ${mark}${hint}`;
    })
    .join(' | ');

  const shareText = generateShareText(
    'schlagziil',
    puzzle.date,
    `${correctCount}/5\n${yearLine}\nKennst du watson?`,
  );

  return (
    <div className="mt-6 text-center">
      <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold">
        {correctCount >= 4 ? 'Stark!' : correctCount >= 2 ? 'Nicht schlecht!' : 'Nächstes Mal!'}
      </h2>
      <p className="mt-1 text-[var(--color-gray-text)]">
        {correctCount}/5 Schlagzeilen erraten
      </p>
      <p className="mt-2 text-sm font-mono">
        {yearLine}
      </p>
      <div className="mt-4">
        <ShareButton text={shareText} />
      </div>

      <div className="mt-6 flex justify-center">
        <AdSlot type="mrec" />
      </div>

      <PostGameSection currentGame="schlagziil" />
    </div>
  );
}
