import { Link } from 'react-router-dom';

const ALL_GAMES = [
  {
    path: '/verbindige',
    key: 'verbindige',
    name: 'Verbindige',
    emoji: '🇨🇭',
    description: 'Finde 4 Gruppen à 4. Schweizer Themen.',
    accentColor: 'var(--color-cyan)',
  },
  {
    path: '/zaemesetzli',
    key: 'zaemesetzli',
    name: 'Zämesetzli',
    emoji: '🧩',
    description: 'Kombiniere Emojis zu deutschen Wörtern.',
    accentColor: 'var(--color-pink)',
  },
  {
    path: '/schlagziil',
    key: 'schlagziil',
    name: 'Schlagziil',
    emoji: '📰',
    description: 'Errate die Wörter in watson-Schlagzeilen.',
    accentColor: 'var(--color-green)',
  },
  {
    path: '/buchstaebli',
    key: 'buchstaebli',
    name: 'Buchstäbli',
    emoji: '🔤',
    description: 'Finde Wörter mit 7 Buchstaben.',
    accentColor: 'var(--color-blue)',
  },
];

interface PostGameSectionProps {
  currentGame: 'verbindige' | 'zaemesetzli' | 'schlagziil' | 'buchstaebli';
}

export function PostGameSection({ currentGame }: PostGameSectionProps) {
  const otherGames = ALL_GAMES.filter((g) => g.key !== currentGame);

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-[var(--color-gray-bg)]" />
        <span className="text-xs font-semibold text-[var(--color-gray-text)] uppercase tracking-wide whitespace-nowrap">
          Noch mehr zum Spielen
        </span>
        <div className="flex-1 h-px bg-[var(--color-gray-bg)]" />
      </div>

      <div className="flex flex-col gap-3">
        {otherGames.map((game) => (
          <Link
            key={game.path}
            to={game.path}
            className="group flex items-center gap-3 rounded-lg border-2 border-[var(--color-gray-bg)] p-3.5 transition-all hover:border-[var(--color-cyan)] hover:shadow-sm active:scale-[0.98]"
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl transition-transform group-hover:scale-105"
              style={{ background: `color-mix(in srgb, ${game.accentColor} 12%, transparent)` }}
            >
              {game.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-[family-name:var(--font-heading)] text-sm font-bold leading-tight">
                {game.name}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-gray-text)] leading-snug">
                {game.description}
              </p>
            </div>
            <span
              className="text-sm text-[var(--color-gray-text)] transition-transform group-hover:translate-x-1 shrink-0"
              aria-hidden
            >
              →
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-[var(--color-gray-text)]">
        Morgen gibt's neue Rätsel — <span className="font-semibold text-[var(--color-black)]">bis morgen! 👋</span>
      </p>
    </div>
  );
}
