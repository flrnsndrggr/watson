import { Link } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';

export function NotFoundPage() {
  return (
    <GameShell>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-6xl font-bold font-[family-name:var(--font-heading)]" style={{ color: 'var(--color-cyan)' }}>
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold font-[family-name:var(--font-heading)]">
          Siite nöd gfunde
        </h1>
        <p className="mt-2 text-[var(--color-gray-text)]">
          Die Siite gits leider nöd. Aber d'Spieli warte uf dich!
        </p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-lg px-6 py-3 font-semibold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--color-cyan)' }}
        >
          Zrugg zur Startsiite
        </Link>
      </div>
    </GameShell>
  );
}
