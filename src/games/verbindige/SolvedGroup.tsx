import type { VerbindigeGroup } from '@/types';

const DIFFICULTY_COLORS: Record<number, string> = {
  1: 'bg-[var(--color-difficulty-1)]',
  2: 'bg-[var(--color-difficulty-2)]',
  3: 'bg-[var(--color-difficulty-3)]',
  4: 'bg-[var(--color-difficulty-4)]',
};

interface SolvedGroupProps {
  group: VerbindigeGroup;
}

export function SolvedGroup({ group }: SolvedGroupProps) {
  return (
    <div
      className={`animate-[popIn_var(--transition-normal)] rounded-[var(--game-tile-radius)] px-4 py-3 text-center text-white ${DIFFICULTY_COLORS[group.difficulty]}`}
    >
      <div className="text-sm font-bold uppercase tracking-wide">
        {group.category_label ?? group.category}
      </div>
      <div className="mt-1.5 flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-xs opacity-90">
        {group.items.map((item) => (
          <span key={item.text}>
            {item.text}
            {item.hochdeutsch && (
              <span className="opacity-75"> = {item.hochdeutsch}</span>
            )}
            {item.region && (
              <span className="opacity-60"> ({item.region})</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
