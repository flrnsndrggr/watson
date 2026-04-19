import { ShareButton } from '@/components/shared/ShareButton';
import { PostGameSection } from '@/components/shared/PostGameSection';
import { generateShareText } from '@/lib/share';
import { useVerbindige } from './useVerbindige';

const DIFFICULTY_EMOJIS: Record<number, string> = {
  1: '🟨',
  2: '🟩',
  3: '🟦',
  4: '🟪',
};

export function VerbindigeResult() {
  const { solvedGroups, status, puzzle } = useVerbindige();
  if (status !== 'won' && status !== 'lost') return null;

  // Build emoji grid from solve order
  const orderedGroups = [...solvedGroups].sort((a, b) => a.guessOrder - b.guessOrder);
  const emojiGrid = orderedGroups
    .map((g) => DIFFICULTY_EMOJIS[g.difficulty].repeat(4))
    .join('\n');

  const shareText = generateShareText('verbindige', puzzle?.date ?? '', emojiGrid);

  return (
    <div className="mt-6 text-center">
      <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold">
        {status === 'won' ? 'Geschafft!' : 'Leider nicht...'}
      </h2>
      <pre className="mx-auto mt-3 text-2xl leading-relaxed whitespace-pre-wrap">
        {emojiGrid}
      </pre>
      <div className="mt-4">
        <ShareButton text={shareText} />
      </div>
      {puzzle && (
        <p className="mt-2 text-xs text-[var(--color-gray-text)]">
          Verbindige #{puzzle.date}
        </p>
      )}

      <PostGameSection currentGame="verbindige" />
    </div>
  );
}
