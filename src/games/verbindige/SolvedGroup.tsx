import type { VerbindigeGroup } from '@/types';

// watson-palette difficulty tokens (css vars live in tokens.css).
// Left-edge bar replaces NYT-style full-color fill — gives the row a
// newspaper-column feel with the category reading like a headline.
const DIFFICULTY_BAR: Record<number, string> = {
  1: 'bg-[var(--color-difficulty-1)]',
  2: 'bg-[var(--color-difficulty-2)]',
  3: 'bg-[var(--color-difficulty-3)]',
  4: 'bg-[var(--color-difficulty-4)]',
};

const DIFFICULTY_TEXT: Record<number, string> = {
  1: 'text-[var(--color-difficulty-1)]',
  2: 'text-[var(--color-difficulty-2)]',
  3: 'text-[var(--color-difficulty-3)]',
  4: 'text-[var(--color-difficulty-4)]',
};

interface SolvedGroupProps {
  group: VerbindigeGroup;
  isReveal?: boolean;
}

export function SolvedGroup({ group, isReveal = false }: SolvedGroupProps) {
  const animation = isReveal
    ? 'animate-[groupUnveil_500ms_ease-out_both]'
    : 'animate-[groupSlideIn_400ms_ease-out]';

  return (
    <div
      className={`relative overflow-hidden rounded-[var(--game-tile-radius)] border border-[var(--color-gray-bg)] bg-white pl-4 pr-4 py-3 ${animation}`}
    >
      {/* left color bar — the visual signal of difficulty */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 ${DIFFICULTY_BAR[group.difficulty]}`}
        aria-hidden="true"
      />
      {/* headline: Onest (heading font), uppercase, colored to match bar */}
      <div
        className={`font-[family-name:var(--font-heading)] text-base font-bold uppercase tracking-wide ${DIFFICULTY_TEXT[group.difficulty]}`}
      >
        {group.category_label ?? group.category}
      </div>
      {/* body: Nunito Sans italic, separated by • bullets */}
      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-sm italic text-[var(--color-black)]">
        {group.items.map((item, i) => (
          <span key={item.text}>
            {i > 0 && <span className="mr-2 text-[var(--color-gray-text)]" aria-hidden="true">•</span>}
            <span className="font-semibold not-italic">{item.text}</span>
            {item.hochdeutsch && (
              <span className="text-[var(--color-gray-text)]"> {item.hochdeutsch}</span>
            )}
            {item.region && (
              <span className="text-[var(--color-gray-text)]"> ({item.region})</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
