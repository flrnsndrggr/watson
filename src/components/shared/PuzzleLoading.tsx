import { GameShell } from './GameShell';

type PuzzleVariant = 'verbindige' | 'schlagloch' | 'zaemesetzli';

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

function VerbindigeSkeleton() {
  return (
    <>
      <div className="grid grid-cols-4 gap-[var(--game-tile-gap)]">
        {Array.from({ length: 16 }, (_, i) => (
          <SkeletonBlock key={i} className="aspect-square" />
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-3">
        <SkeletonBlock className="h-10 w-28 rounded-full" />
        <SkeletonBlock className="h-10 w-28 rounded-full" />
      </div>
    </>
  );
}

function SchlaglochSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-24 w-full rounded-xl" />
        <SkeletonBlock className="h-5 w-24 self-center" />
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <SkeletonBlock className="h-12 w-full rounded-lg" />
        <SkeletonBlock className="h-12 w-full rounded-lg" />
        <SkeletonBlock className="h-12 w-full rounded-lg" />
      </div>
      <div className="mt-4 flex justify-center">
        <SkeletonBlock className="h-3 w-20" />
      </div>
    </>
  );
}

function ZaemesetzliSkeleton() {
  return (
    <>
      <div className="flex flex-wrap justify-center gap-3">
        {Array.from({ length: 8 }, (_, i) => (
          <SkeletonBlock key={i} className="h-14 w-14 rounded-xl" />
        ))}
      </div>
      <div className="mt-6">
        <SkeletonBlock className="h-12 w-full rounded-lg" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <SkeletonBlock className="h-4 w-16" />
        <SkeletonBlock className="h-3 flex-1 rounded-full" />
      </div>
    </>
  );
}

const skeletons: Record<PuzzleVariant, React.FC> = {
  verbindige: VerbindigeSkeleton,
  schlagloch: SchlaglochSkeleton,
  zaemesetzli: ZaemesetzliSkeleton,
};

export function PuzzleLoading({ variant = 'verbindige' }: { variant?: PuzzleVariant }) {
  const Skeleton = skeletons[variant];
  return (
    <GameShell>
      <div className="mb-4 flex flex-col items-center gap-2">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-4 w-32" />
      </div>
      <Skeleton />
    </GameShell>
  );
}
