interface GameHeaderProps {
  title: string;
  puzzleId: string;
  subtitle?: string;
  streak?: number;
}

export function GameHeader({ title, puzzleId, subtitle, streak }: GameHeaderProps) {
  return (
    <div className="mb-4 text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight">
        {title}
        <span className="ml-2 text-[var(--color-gray-text)] text-base font-normal">
          #{puzzleId}
        </span>
        {streak != null && streak >= 2 && (
          <span
            className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-[var(--color-pink)]/10 px-2 py-0.5 text-sm font-semibold text-[var(--color-pink)]"
            title={`${streak} Tage in Folge`}
          >
            🔥 {streak}
          </span>
        )}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-[var(--color-gray-text)]">{subtitle}</p>
      )}
    </div>
  );
}
