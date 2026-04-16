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
      className={`mx-auto flex items-center justify-center bg-[var(--color-gray-bg)] text-xs text-[var(--color-gray-text)] ${sizes[type]} ${className}`}
    >
      Werbung
    </div>
  );
}
