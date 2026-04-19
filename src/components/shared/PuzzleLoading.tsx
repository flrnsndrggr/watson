import { GameShell } from './GameShell';

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-[var(--game-tile-radius)] bg-[var(--color-gray-bg)] ${className ?? ''}`}
      style={{
        backgroundImage:
          'linear-gradient(90deg, var(--color-gray-bg) 0%, #f5f5f5 40%, var(--color-gray-bg) 80%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

export function PuzzleLoading() {
  return (
    <GameShell>
      {/* Header skeleton */}
      <div className="mb-4 flex flex-col items-center gap-2">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-4 w-32" />
      </div>

      {/* 4x4 tile grid skeleton */}
      <div className="grid grid-cols-4 gap-[var(--game-tile-gap)]">
        {Array.from({ length: 16 }, (_, i) => (
          <SkeletonBlock key={i} className="aspect-square" />
        ))}
      </div>

      {/* Action buttons skeleton */}
      <div className="mt-4 flex justify-center gap-3">
        <SkeletonBlock className="h-10 w-28 rounded-full" />
        <SkeletonBlock className="h-10 w-28 rounded-full" />
      </div>
    </GameShell>
  );
}
