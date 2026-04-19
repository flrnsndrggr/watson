import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { AdSlot } from '@/components/shared/AdSlot';
import { getStreak } from '@/lib/streaks';
import { getTodayDateCET } from '@/lib/supabase';
import type { GameType, StreakData } from '@/types';

interface GameConfig {
  path: string;
  name: string;
  emoji: string;
  description: string;
  gameType: GameType;
}

const GAMES: GameConfig[] = [
  {
    path: '/verbindige',
    name: 'Verbindige',
    emoji: '🇨🇭',
    description: 'Finde 4 Gruppen à 4. Schweizer Themen, watson-Twist.',
    gameType: 'verbindige',
  },
  {
    path: '/buchstaebli',
    name: 'Buchstäbli',
    emoji: '🐝',
    description: 'Bilde Wörter aus 7 Buchstaben. Mundart-Bonus!',
    gameType: 'buchstaebli',
  },
  {
    path: '/zaemesetzli',
    name: 'Zämesetzli',
    emoji: '🧩',
    description: 'Kombiniere Emojis zu zusammengesetzten Wörtern. Mundart-Bonus!',
    gameType: 'zaemesetzli',
  },
  {
    path: '/schlagziil',
    name: 'Schlagziil',
    emoji: '📰',
    description: 'Errate die fehlenden Wörter in watson-Schlagzeilen.',
    gameType: 'schlagziil',
  },
];

interface GameStatus {
  playedToday: boolean;
  streak: StreakData;
}

function useGameStatuses(): Record<GameType, GameStatus> {
  const [statuses, setStatuses] = useState<Record<GameType, GameStatus>>(() => loadStatuses());

  // Re-check when user returns to this page (e.g. after playing a game)
  useEffect(() => {
    function handleFocus() {
      setStatuses(loadStatuses());
    }
    window.addEventListener('focus', handleFocus);
    // Also re-check on visibility change (mobile tab switching)
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        setStatuses(loadStatuses());
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return statuses;
}

function loadStatuses(): Record<GameType, GameStatus> {
  const today = getTodayDateCET();
  const gameTypes: GameType[] = ['verbindige', 'buchstaebli', 'zaemesetzli', 'schlagziil'];
  const result = {} as Record<GameType, GameStatus>;
  for (const gt of gameTypes) {
    const streak = getStreak(gt);
    result[gt] = {
      playedToday: streak.last_played === today,
      streak,
    };
  }
  return result;
}

export function LandingPage() {
  const statuses = useGameStatuses();
  const playedCount = GAMES.filter((g) => statuses[g.gameType].playedToday).length;
  const totalStreak = GAMES.reduce((sum, g) => sum + statuses[g.gameType].streak.current, 0);

  return (
    <GameShell>
      {/* Hero */}
      <div className="mb-5 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold">
          watson <span className="text-[var(--color-cyan)]">Spiele</span>
        </h1>
        <p className="mt-1 text-sm text-[var(--color-gray-text)] italic">
          Spiel, aber deep.
        </p>
      </div>

      {/* Daily progress summary */}
      <div className="mb-5 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          {GAMES.map((g) => (
            <div
              key={g.gameType}
              className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                statuses[g.gameType].playedToday
                  ? 'bg-[var(--color-green)]'
                  : 'bg-[var(--color-gray-bg)]'
              }`}
              aria-label={`${g.name}: ${statuses[g.gameType].playedToday ? 'gespielt' : 'offen'}`}
            />
          ))}
          <span className="ml-1.5 text-xs font-semibold text-[var(--color-gray-text)]">
            {playedCount}/{GAMES.length} gespielt
          </span>
        </div>
        {totalStreak > 0 && (
          <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-pink)]">
            <span className={totalStreak >= 7 ? 'animate-pulse' : ''}>
              &#x1F525;
            </span>
            {totalStreak} Tage
          </span>
        )}
      </div>

      {/* Sponsor bar */}
      <AdSlot type="sponsor-bar" className="mb-5" />

      {/* Game cards */}
      <div className="flex flex-col gap-3">
        {GAMES.map((game) => {
          const status = statuses[game.gameType];
          const played = status.playedToday;
          return (
            <Link
              key={game.path}
              to={game.path}
              className={`group flex items-center gap-4 rounded-lg border-2 p-4 transition-all duration-[var(--transition-fast)] ${
                played
                  ? 'border-[var(--color-green)]/30 bg-[var(--color-green)]/[0.03]'
                  : 'border-[var(--color-gray-bg)] hover:border-[var(--color-cyan)] hover:shadow-sm'
              }`}
            >
              <span
                className={`relative flex h-14 w-14 items-center justify-center rounded-lg text-2xl transition-transform group-hover:scale-105 ${
                  played ? 'bg-[var(--color-green)]/10' : 'bg-[var(--color-gray-bg)]'
                }`}
              >
                {game.emoji}
                {played && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-green)] text-[10px] text-white">
                    &#x2713;
                  </span>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold">
                    {game.name}
                  </h2>
                  {played ? (
                    <span className="rounded bg-[var(--color-green)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      GESPIELT
                    </span>
                  ) : (
                    <span className="rounded bg-[var(--color-cyan)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      TÄGLICH
                    </span>
                  )}
                  {status.streak.current >= 2 && (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-[var(--color-pink)]">
                      &#x1F525; {status.streak.current}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-[var(--color-gray-text)]">
                  {played ? `Weiter spielen oder Ergebnis ansehen` : game.description}
                </p>
              </div>
              <span className="text-[var(--color-gray-text)] transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
          );
        })}
      </div>

      {/* Encouragement when all games played */}
      {playedCount === GAMES.length && (
        <div className="mt-5 rounded-lg bg-[var(--color-green)]/[0.06] p-4 text-center">
          <p className="text-sm font-semibold">
            Alle Spiele gespielt!
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-gray-text)]">
            Morgen gibt&apos;s neue Rätsel. Bis denn!
          </p>
        </div>
      )}

      {/* Post-game MREC */}
      <div className="mt-8 flex justify-center">
        <AdSlot type="mrec" />
      </div>
    </GameShell>
  );
}
