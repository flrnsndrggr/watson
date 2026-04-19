interface ErrorDotsProps {
  total: number;
  used: number;
}

export function ErrorDots({ total, used }: ErrorDotsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-[var(--color-gray-text)] mr-1">Fehler:</span>
      {Array.from({ length: total }, (_, i) => {
        const isFilled = i < used;
        const isLatest = i === used - 1;
        return (
          <span
            key={isLatest ? `dot-${i}-${used}` : i}
            className={`inline-block h-3 w-3 rounded-full transition-colors ${
              isFilled
                ? 'bg-[var(--color-pink)]'
                : 'bg-[var(--color-gray-bg)]'
            }`}
            style={isLatest ? { animation: 'dotPulse 400ms ease-out' } : undefined}
          />
        );
      })}
    </div>
  );
}
