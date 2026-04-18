import { GameShell } from './GameShell';

export function PuzzleLoading() {
  return (
    <GameShell>
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--color-gray-bg)] border-t-[var(--color-cyan)]" />
      </div>
    </GameShell>
  );
}
