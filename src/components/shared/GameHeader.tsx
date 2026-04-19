interface GameHeaderProps {
  title: string;
  puzzleNumber: number;
  subtitle?: string;
  onInfoClick?: () => void;
}

export function GameHeader({ title, puzzleNumber, subtitle, onInfoClick }: GameHeaderProps) {
  return (
    <div className="mb-4 text-center relative">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight">
        {title}
        <span className="ml-2 text-[var(--color-gray-text)] text-base font-normal">
          #{puzzleNumber.toString().padStart(3, '0')}
        </span>
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-[var(--color-gray-text)]">{subtitle}</p>
      )}
      {onInfoClick && (
        <button
          onClick={onInfoClick}
          className="absolute right-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--color-gray-bg)] text-[var(--color-gray-text)] hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)] transition-colors"
          aria-label="Spielanleitung anzeigen"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6.5 6.5a1.5 1.5 0 1 1 2.12 1.37c-.42.24-.62.54-.62.88V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
}
