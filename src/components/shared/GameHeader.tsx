interface GameHeaderProps {
  title: string;
  puzzleNumber: number;
  subtitle?: string;
}

export function GameHeader({ title, puzzleNumber, subtitle }: GameHeaderProps) {
  return (
    <div className="mb-4 text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight">
        {title}
        <span className="ml-2 text-[var(--color-gray-text)] text-base font-normal">
          #{puzzleNumber.toString().padStart(3, '0')}
        </span>
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-[var(--color-gray-text)]">{subtitle}</p>
      )}
    </div>
  );
}
