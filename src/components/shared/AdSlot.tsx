interface AdSlotProps {
  type: 'sponsor-bar' | 'mrec' | 'interstitial';
  className?: string;
}

export function AdSlot({ type, className = '' }: AdSlotProps) {
  const sizes: Record<string, string> = {
    'sponsor-bar': 'h-[90px] w-full max-w-[728px]',
    'mrec': 'h-[250px] w-[300px]',
    'interstitial': 'h-full w-full',
  };

  return (
    <div
      className={`mx-auto flex flex-col items-center justify-center rounded-[var(--game-tile-radius)] border border-dashed border-[var(--color-gray-text)]/30 bg-[var(--color-gray-bg)] ${sizes[type]} ${className}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-gray-text)]">
        Anzeige
      </span>
    </div>
  );
}
