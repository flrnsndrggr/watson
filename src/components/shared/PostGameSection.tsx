import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getDailyResults, type DailyResult } from '@/lib/dailyResults';
import { getStreak } from '@/lib/streaks';
import { getTodayDateCET } from '@/lib/dateUtils';
import { ShareButton } from '@/components/shared/ShareButton';
import type { GameType } from '@/types';

interface GameConfig {
  path: string;
  key: GameType;
  name: string;
  emoji: string;
  description: string;
  accentColor: string;
}

const ALL_GAMES: GameConfig[] = [
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
    path: '/schlagloch',
    key: 'schlagloch',
    name: 'Schlagloch',
    emoji: '📰',
    description: 'Errate die Wörter in watson-Schlagzeilen.',
    accentColor: 'var(--color-green)',
  },
];

interface GameStatus {
  playedToday: boolean;
  result: DailyResult | null;
  streakCurrent: number;
}

function loadGameStatuses(): Record<GameType, GameStatus> {
  const today = getTodayDateCET();
  const dailyResults = getDailyResults();
  const result = {} as Record<GameType, GameStatus>;
  for (const game of ALL_GAMES) {
    const streak = getStreak(game.key);
    result[game.key] = {
      playedToday: streak.last_played === today,
      result: dailyResults.results[game.key] ?? null,
      streakCurrent: streak.current,
    };
  }
  return result;
}

function buildSweepShareText(statuses: Record<GameType, GameStatus>): string {
  const today = new Date().toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'numeric',
    timeZone: 'Europe/Zurich',
  });
  const lines: string[] = [`watson Spiele 🇨🇭 ${today}`];
  for (const game of ALL_GAMES) {
    const s = statuses[game.key];
    if (s.result) {
      const prefix = s.result.emojiLine ? `${s.result.emojiLine} ` : `${game.emoji} `;
      lines.push(`${prefix}${game.name} ${s.result.summary}`);
    }
  }
  lines.push('Spiel, aber deep.');
  lines.push('games-watson.netlify.app');
  return lines.join('\n');
}

interface PostGameSectionProps {
  currentGame: GameType;
}

export function PostGameSection({ currentGame }: PostGameSectionProps) {
  const [statuses, setStatuses] = useState<Record<GameType, GameStatus>>(() => loadGameStatuses());
  const confettiFired = useRef(false);

  // Reload statuses when tab regains focus (user may have played another game)
  useEffect(() => {
    function reload() { setStatuses(loadGameStatuses()); }
    window.addEventListener('focus', reload);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reload();
    });
    return () => {
      window.removeEventListener('focus', reload);
    };
  }, []);

  const playedCount = ALL_GAMES.filter((g) => statuses[g.key].playedToday).length;
  const allPlayed = playedCount === ALL_GAMES.length;
  const remaining = ALL_GAMES.length - playedCount;

  // Fire confetti when daily sweep is complete
  useEffect(() => {
    if (allPlayed && !confettiFired.current) {
      confettiFired.current = true;
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6, x: 0.4 } });
        setTimeout(() => {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6, x: 0.6 } });
        }, 150);
      });
    }
  }, [allPlayed]);

  return (
    <div className="mt-8">
      {/* Section header with progress */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-[var(--color-gray-bg)]" />
        <span className="text-xs font-semibold text-[var(--color-gray-text)] uppercase tracking-wide whitespace-nowrap">
          {allPlayed ? 'Tages-Sweep!' : 'Dein Spiele-Tag'}
        </span>
        <div className="flex-1 h-px bg-[var(--color-gray-bg)]" />
      </div>

      {/* Progress dots */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <div className="flex items-center gap-1.5">
          {ALL_GAMES.map((g) => (
            <div
              key={g.key}
              className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                statuses[g.key].playedToday
                  ? 'bg-[var(--color-green)]'
                  : g.key === currentGame
                    ? 'bg-[var(--color-cyan)] animate-pulse'
                    : 'bg-[var(--color-gray-bg)]'
              }`}
              aria-label={`${g.name}: ${statuses[g.key].playedToday ? 'gespielt' : 'offen'}`}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-[var(--color-gray-text)]">
          {playedCount}/{ALL_GAMES.length}
        </span>
      </div>

      {/* Game list — shows status-aware cards */}
      <div className="flex flex-col gap-2.5">
        {ALL_GAMES.map((game) => {
          const status = statuses[game.key];
          const isCurrent = game.key === currentGame;
          const played = status.playedToday;

          // Current game: show compact "done" state
          if (isCurrent && played) {
            return (
              <div
                key={game.key}
                className="flex items-center gap-3 rounded-lg border-2 border-[var(--color-green)]/30 bg-[var(--color-green)]/[0.03] p-3"
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-green)]/10 text-lg">
                  {game.emoji}
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-green)] text-[9px] text-white">
                    ✓
                  </span>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-[family-name:var(--font-heading)] text-sm font-bold leading-tight">
                    {game.name}
                  </p>
                  {status.result && (
                    <p className="mt-0.5 text-xs font-semibold text-[var(--color-gray-text)]">
                      {status.result.summary}
                      {status.result.emojiLine && (
                        <span className="ml-1.5 tracking-wide">
                          {status.result.emojiLine.split('\n')[0]}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          // Other played game: compact done state
          if (played) {
            return (
              <Link
                key={game.key}
                to={game.path}
                className="group flex items-center gap-3 rounded-lg border-2 border-[var(--color-green)]/30 bg-[var(--color-green)]/[0.03] p-3 transition-all hover:border-[var(--color-green)]/50"
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-green)]/10 text-lg">
                  {game.emoji}
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-green)] text-[9px] text-white">
                    ✓
                  </span>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-[family-name:var(--font-heading)] text-sm font-bold leading-tight">
                    {game.name}
                  </p>
                  {status.result && (
                    <p className="mt-0.5 text-xs font-semibold text-[var(--color-gray-text)]">
                      {status.result.summary}
                    </p>
                  )}
                </div>
                <span className="text-xs text-[var(--color-gray-text)] transition-transform group-hover:translate-x-0.5 shrink-0">
                  →
                </span>
              </Link>
            );
          }

          // Unplayed game: prominent CTA
          return (
            <Link
              key={game.key}
              to={game.path}
              className="group flex items-center gap-3 rounded-lg border-2 border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/[0.04] p-3.5 transition-all hover:border-[var(--color-cyan)] hover:shadow-sm active:scale-[0.98]"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl transition-transform group-hover:scale-105"
                style={{ background: `color-mix(in srgb, ${game.accentColor} 12%, transparent)` }}
              >
                {game.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-[family-name:var(--font-heading)] text-sm font-bold leading-tight">
                    {game.name}
                  </p>
                  {status.streakCurrent >= 2 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[var(--color-pink)]">
                      🔥 {status.streakCurrent}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-gray-text)] leading-snug">
                  {game.description}
                </p>
              </div>
              <span className="rounded bg-[var(--color-cyan)] px-2.5 py-1 text-[11px] font-bold text-white transition-transform group-hover:translate-x-0.5 shrink-0">
                SPIELEN
              </span>
            </Link>
          );
        })}
      </div>

      {/* Sweep celebration when all games complete */}
      {allPlayed && (
        <div className="mt-5 animate-[popIn_400ms_ease-out] rounded-xl border-2 border-[var(--color-pink)]/20 bg-gradient-to-br from-[var(--color-pink)]/[0.04] to-[var(--color-cyan)]/[0.04] p-4 text-center">
          <p className="font-[family-name:var(--font-heading)] text-base font-bold text-[var(--color-pink)]">
            🎉 Alle {ALL_GAMES.length} Spiele geschafft!
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-gray-text)]">
            Starke Leistung — teile deinen Tages-Sweep.
          </p>
          <div className="mt-3">
            <ShareButton
              text={buildSweepShareText(statuses)}
              label="Tages-Ergebnis teilen"
              game="verbindige"
            />
          </div>
        </div>
      )}

      {/* Motivation CTA when games remain */}
      {!allPlayed && remaining > 0 && (
        <p className="mt-4 text-center text-xs text-[var(--color-gray-text)]">
          {remaining === 1 ? (
            <>Noch <span className="font-semibold text-[var(--color-cyan)]">1 Spiel</span> bis zum Tages-Sweep! 🎯</>
          ) : (
            <>Noch <span className="font-semibold text-[var(--color-cyan)]">{remaining} Spiele</span> bis zum Tages-Sweep! 🎯</>
          )}
        </p>
      )}
    </div>
  );
}
