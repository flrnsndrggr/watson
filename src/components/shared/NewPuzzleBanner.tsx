interface NewPuzzleBannerProps {
  onRefresh: () => void;
}

export function NewPuzzleBanner({ onRefresh }: NewPuzzleBannerProps) {
  return (
    <div
      role="status"
      className="mb-4 flex items-center justify-between rounded-lg bg-[var(--color-cyan)] px-4 py-3 text-white animate-[popIn_var(--transition-normal)]"
    >
      <span className="font-heading text-sm font-semibold">
        Neues Rätsel verfügbar!
      </span>
      <button
        onClick={onRefresh}
        className="min-h-[44px] min-w-[44px] rounded bg-white/20 px-4 py-2 text-sm font-bold text-white transition-opacity hover:bg-white/30 active:bg-white/40"
        aria-label="Neues Rätsel laden"
      >
        Spielen
      </button>
    </div>
  );
}
