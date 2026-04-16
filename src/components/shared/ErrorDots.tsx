interface ErrorDotsProps {
  total: number;
  used: number;
}

export function ErrorDots({ total, used }: ErrorDotsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-[var(--color-gray-text)] mr-1">Fehler:</span>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-3 w-3 rounded-full transition-colors ${
            i < used
              ? 'bg-[var(--color-pink)]'
              : 'bg-[var(--color-gray-bg)]'
          }`}
        />
      ))}
    </div>
  );
}
