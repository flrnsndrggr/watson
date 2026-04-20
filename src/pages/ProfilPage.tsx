import { Link } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { StreakBadge } from '@/components/shared/StreakBadge';
import { NotificationSettings } from '@/components/shared/NotificationSettings';
import { useUserAuth } from '@/lib/userAuthContext';
import { AuthModal } from '@/components/shared/AuthModal';
import { getStreak } from '@/lib/streaks';
import type { GameType, StreakData } from '@/types';
import { useState } from 'react';

interface GameInfo {
  type: GameType;
  name: string;
  emoji: string;
  path: string;
  color: string;
}

const GAMES: GameInfo[] = [
  { type: 'verbindige', name: 'Verbindige', emoji: '🇨🇭', path: '/verbindige', color: 'var(--color-cyan)' },
  { type: 'zaemesetzli', name: 'Zämesetzli', emoji: '🧩', path: '/zaemesetzli', color: 'var(--color-green)' },
  { type: 'schlagziil', name: 'Schlagziil', emoji: '📰', path: '/schlagziil', color: 'var(--color-cyan)' },
];

function StreakCard({ game, streak }: { game: GameInfo; streak: StreakData }) {
  const hasPlayed = streak.longest > 0 || streak.current > 0;

  return (
    <div className="rounded-lg border-2 border-[var(--color-gray-bg)] p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>{game.emoji}</span>
        <div className="flex-1">
          <Link
            to={game.path}
            className="font-[family-name:var(--font-heading)] text-base font-bold hover:text-[var(--color-cyan)] transition-colors"
          >
            {game.name}
          </Link>
        </div>
        {streak.current >= 1 && <StreakBadge streak={streak} />}
      </div>

      {hasPlayed ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatBox label="Aktueller Streak" value={`${streak.current} ${streak.current === 1 ? 'Tag' : 'Tage'}`} />
          <StatBox label="Längster Streak" value={`${streak.longest} ${streak.longest === 1 ? 'Tag' : 'Tage'}`} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--color-gray-text)]">
          Noch nicht gespielt.{' '}
          <Link to={game.path} className="text-[var(--color-cyan)] hover:underline">
            Jetzt spielen &rarr;
          </Link>
        </p>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-[var(--color-gray-bg)] px-3 py-2 text-center">
      <div className="text-lg font-bold text-[var(--color-black)]">{value}</div>
      <div className="text-xs text-[var(--color-gray-text)]">{label}</div>
    </div>
  );
}

export function ProfilPage() {
  const { user, loading, signOut } = useUserAuth();
  const [showAuth, setShowAuth] = useState(false);

  const streaks = GAMES.map((game) => ({
    game,
    streak: getStreak(game.type),
  }));

  const totalCurrent = streaks.reduce((sum, s) => sum + s.streak.current, 0);
  const bestStreak = Math.max(...streaks.map((s) => s.streak.longest), 0);
  const gamesActive = streaks.filter((s) => s.streak.current >= 1).length;

  return (
    <GameShell>
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold">
          Mein Profil
        </h1>
      </div>

      {/* Account section */}
      <div className="mb-6 rounded-lg border-2 border-[var(--color-gray-bg)] p-4">
        {loading ? (
          <div className="h-10 animate-pulse rounded bg-[var(--color-gray-bg)]" />
        ) : user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-cyan)] text-sm font-bold text-white">
                {user.email?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--color-black)]">
                  {user.email}
                </div>
                <div className="text-xs text-[var(--color-gray-text)]">
                  Angemeldet
                </div>
              </div>
            </div>
            <button
              onClick={() => void signOut()}
              className="rounded px-3 py-1.5 text-xs text-[var(--color-gray-text)] hover:text-[var(--color-black)] hover:bg-[var(--color-gray-bg)] transition-colors cursor-pointer"
            >
              Abmelden
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-[var(--color-gray-text)]">
              Melde dich an, um deinen Fortschritt zu sichern.
            </p>
            <button
              onClick={() => setShowAuth(true)}
              className="mt-3 rounded bg-[var(--color-cyan)] px-5 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              Anmelden
            </button>
          </div>
        )}
      </div>

      {/* Overview stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatBox label="Aktive Streaks" value={String(gamesActive)} />
        <StatBox label="Streak-Tage total" value={String(totalCurrent)} />
        <StatBox label="Bester Streak" value={`${bestStreak} ${bestStreak === 1 ? 'Tag' : 'Tage'}`} />
      </div>

      {/* Notification settings */}
      <div className="mb-6">
        <NotificationSettings />
      </div>

      {/* Per-game streaks */}
      <h2 className="mb-3 font-[family-name:var(--font-heading)] text-lg font-bold">
        Spiele
      </h2>
      <div className="flex flex-col gap-3">
        {streaks.map(({ game, streak }) => (
          <StreakCard key={game.type} game={game} streak={streak} />
        ))}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </GameShell>
  );
}
