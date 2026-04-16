import { Link } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { AdSlot } from '@/components/shared/AdSlot';

const GAMES = [
  {
    path: '/verbindige',
    name: 'Verbindige',
    emoji: '🇨🇭',
    description: 'Finde 4 Gruppen à 4. Schweizer Themen, watson-Twist.',
    color: 'var(--color-cyan)',
  },
  {
    path: '/buchstaebli',
    name: 'Buchstäbli',
    emoji: '🐝',
    description: 'Bilde Wörter aus 7 Buchstaben. Mundart-Bonus!',
    color: 'var(--color-pink)',
  },
  {
    path: '/zaemesetzli',
    name: 'Zämesetzli',
    emoji: '🧩',
    description: 'Kombiniere Emojis zu zusammengesetzten Wörtern. Mundart-Bonus!',
    color: 'var(--color-green)',
  },
  {
    path: '/schlagziil',
    name: 'Schlagziil',
    emoji: '📰',
    description: 'Errate die fehlenden Wörter in watson-Schlagzeilen.',
    color: 'var(--color-cyan)',
  },
];

export function LandingPage() {
  return (
    <GameShell>
      {/* Hero */}
      <div className="mb-6 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold">
          watson <span className="text-[var(--color-cyan)]">Spiele</span>
        </h1>
        <p className="mt-1 text-sm text-[var(--color-gray-text)] italic">
          Spiel, aber deep.
        </p>
      </div>

      {/* Sponsor bar */}
      <AdSlot type="sponsor-bar" className="mb-6" />

      {/* Game cards */}
      <div className="flex flex-col gap-4">
        {GAMES.map((game) => (
          <Link
            key={game.path}
            to={game.path}
            className="group flex items-center gap-4 rounded-lg border-2 border-[var(--color-gray-bg)] p-4 transition-all hover:border-[var(--color-cyan)] hover:shadow-sm"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--color-gray-bg)] text-2xl transition-transform group-hover:scale-105">
              {game.emoji}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold">
                  {game.name}
                </h2>
                <span className="rounded bg-[var(--color-cyan)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  TÄGLICH
                </span>
              </div>
              <p className="mt-0.5 text-sm text-[var(--color-gray-text)]">
                {game.description}
              </p>
            </div>
            <span className="text-[var(--color-gray-text)] transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        ))}
      </div>

      {/* Post-game MREC */}
      <div className="mt-8 flex justify-center">
        <AdSlot type="mrec" />
      </div>
    </GameShell>
  );
}
