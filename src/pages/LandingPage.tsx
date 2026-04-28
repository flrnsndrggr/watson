import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { AdSlot } from '@/components/shared/AdSlot';
import { ShareButton } from '@/components/shared/ShareButton';
import { StreakFreezeModal } from '@/components/shared/StreakFreezeModal';
import { useUserAuth } from '@/lib/userAuthContext';
import {
  getStreak,
  getStreakRaw,
  getRecoverableStreak,
  getFreezesBankedSync,
} from '@/lib/streaks';
import { getTodayDateCET } from '@/lib/dateUtils';
import { getDailyResults, type DailyResult } from '@/lib/dailyResults';
import { getStreakRiskLevel, type RiskLevel } from '@/lib/streakRisk';
import { logEvent } from '@/lib/events';
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
    emoji: '\u{1F1E8}\u{1F1ED}',
    description: 'Finde 4 Gruppen \u00E0 4. Schweizer Themen, watson-Twist.',
    gameType: 'verbindige',
  },
  {
    path: '/zaemesetzli',
    name: 'Z\u00E4mesetzli',
    emoji: '\u{1F9E9}',
    description: 'Kombiniere Emojis zu zusammengesetzten W\u00F6rtern. Mundart-Bonus!',
    gameType: 'zaemesetzli',
  },
  {
    path: '/schlagloch',
    name: 'Schlagloch',
    emoji: '\u{1F4F0}',
    description: 'Errate die fehlenden W\u00F6rter in watson-Schlagzeilen.',
    gameType: 'schlagloch',
  },
];

interface GameStatus {
  playedToday: boolean;
  inProgress: boolean;
  streak: StreakData;
  rawStreak: StreakData;
  recoverable: StreakData | null;
  riskLevel: RiskLevel;
  result: DailyResult | null;
}

function hasInProgressForToday(game: GameType, today: string): boolean {
  try {
    const raw = localStorage.getItem(`watson_progress_${game}`);
    if (!raw) return false;
    const env = JSON.parse(raw) as { date?: string };
    return env.date === today;
  } catch {
    return false;
  }
}

function loadStatuses(): Record<GameType, GameStatus> {
  const today = getTodayDateCET();
  const dailyResults = getDailyResults();
  const gameTypes: GameType[] = ['verbindige', 'zaemesetzli', 'schlagloch'];
  const result = {} as Record<GameType, GameStatus>;
  for (const gt of gameTypes) {
    const streak = getStreak(gt);
    const rawStreak = getStreakRaw(gt);
    const playedToday = streak.last_played === today;
    result[gt] = {
      playedToday,
      // "in progress" only counts when not yet finished today
      inProgress: !playedToday && hasInProgressForToday(gt, today),
      streak,
      rawStreak,
      recoverable: getRecoverableStreak(gt),
      riskLevel: getStreakRiskLevel(rawStreak),
      result: dailyResults.results[gt] ?? null,
    };
  }
  return result;
}

function useGameStatuses(nonce: number = 0): Record<GameType, GameStatus> {
  const [statuses, setStatuses] = useState<Record<GameType, GameStatus>>(() => loadStatuses());

  useEffect(() => {
    setStatuses(loadStatuses());
  }, [nonce]);

  useEffect(() => {
    function reload() {
      setStatuses(loadStatuses());
    }
    window.addEventListener('focus', reload);
    function handleVisibility() {
      if (document.visibilityState === 'visible') reload();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', reload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return statuses;
}

function useNextPuzzleCountdown(): string {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
    }
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

function buildDailySweepShareText(
  statuses: Record<GameType, GameStatus>,
): string {
  const today = new Date().toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'numeric',
    year: undefined,
    timeZone: 'Europe/Zurich',
  });
  const lines: string[] = [`watson Spiele \u{1F1E8}\u{1F1ED} ${today}`];

  for (const game of GAMES) {
    const s = statuses[game.gameType];
    if (s.result) {
      const emoji = s.result.emojiLine ?? '';
      const prefix = emoji ? `${emoji} ` : `${game.emoji} `;
      lines.push(`${prefix}${game.name} ${s.result.summary}`);
    }
  }

  lines.push('Spiel, aber deep.');
  lines.push('games-watson.netlify.app');
  return lines.join('\n');
}

export function LandingPage() {
  const [statusesNonce, setStatusesNonce] = useState(0);
  const statuses = useGameStatuses(statusesNonce);
  const [freezeModalGame, setFreezeModalGame] = useState<GameConfig | null>(null);
  const reloadStatuses = () => setStatusesNonce((n) => n + 1);
  const { user } = useUserAuth();
  // First-letter-cased greeting from email local-part — keeps it personal
  // even before the user has set a username. "max@…" → "Max".
  const greetingName = (() => {
    if (!user?.email) return null;
    const local = user.email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() ?? '';
    if (!local) return null;
    return local.charAt(0).toUpperCase() + local.slice(1);
  })();
  const playedCount = GAMES.filter((g) => statuses[g.gameType].playedToday).length;
  const totalStreak = GAMES.reduce((sum, g) => sum + statuses[g.gameType].streak.current, 0);
  const allPlayed = playedCount === GAMES.length;
  const hasAnyResult = GAMES.some((g) => statuses[g.gameType].result !== null);
  const countdown = useNextPuzzleCountdown();
  const confettiFired = useRef(false);
  const atRiskGames = GAMES.filter(
    (g) => statuses[g.gameType].riskLevel !== 'safe' && !statuses[g.gameType].playedToday,
  );
  const recoverableGames = GAMES.filter((g) => statuses[g.gameType].recoverable !== null);
  const freezesBanked = getFreezesBankedSync();
  const canRecover = freezesBanked > 0 && recoverableGames.length > 0;

  // Log at-risk visibility once per day per game (de-duped via localStorage).
  useEffect(() => {
    const today = getTodayDateCET();
    const KEY = 'watson_at_risk_logged';
    let logged: Record<string, string> = {};
    try {
      logged = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    } catch {
      logged = {};
    }
    let dirty = false;
    for (const g of atRiskGames) {
      if (logged[g.gameType] === today) continue;
      logged[g.gameType] = today;
      dirty = true;
      void logEvent('streak_at_risk_seen', {
        gameType: g.gameType,
        payload: {
          current: statuses[g.gameType].rawStreak.current,
          level: statuses[g.gameType].riskLevel,
        },
      });
    }
    if (dirty) {
      try { localStorage.setItem(KEY, JSON.stringify(logged)); } catch { /* ignore */ }
    }
  }, [atRiskGames, statuses]);

  // Confetti when all games are completed
  useEffect(() => {
    if (allPlayed && hasAnyResult && !confettiFired.current) {
      confettiFired.current = true;
      import('canvas-confetti').then(({ default: confetti }) => {
        // Double burst for the daily sweep celebration
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.5, x: 0.3 } });
        setTimeout(() => {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.5, x: 0.7 } });
        }, 200);
      });
    }
  }, [allPlayed, hasAnyResult]);

  const todayCET = getTodayDateCET();
  const todayLong = new Date(`${todayCET}T00:00:00`).toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Zurich',
  });

  return (
    <GameShell>
      {/* Hero */}
      <div className="mb-5 text-center">
        {greetingName && (
          <p className="mb-1 text-sm text-[var(--color-gray-text)]">
            Hoi, <span className="font-semibold text-[color:var(--ink,var(--color-black))]">{greetingName}</span>!
          </p>
        )}
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-black tracking-tight">
          watson <span className="text-[var(--color-pink)]">spiele</span>
        </h1>
        <p className="mt-1 text-sm text-[var(--color-gray-text)] italic">
          Spiel, aber deep.
        </p>
        <p className="mt-2 text-xs text-[var(--color-gray-text)]">
          <span className="font-semibold text-[color:var(--ink,var(--color-black))]">{todayLong}</span>
          <span className="mx-2 opacity-60">·</span>
          <span className="font-mono">#{todayCET}</span>
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

      {/* At-risk streak chip — fires after 18:00 CET when a streak ≥ 2 hasn't
          been played today. Critical (≥ 22:00) shows a brighter pink. */}
      {atRiskGames.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex flex-wrap items-center justify-center gap-2"
        >
          {atRiskGames.map((g) => {
            const s = statuses[g.gameType];
            const critical = s.riskLevel === 'critical';
            return (
              <Link
                key={g.gameType}
                to={g.path}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-transform hover:scale-[1.02] ${
                  critical
                    ? 'bg-[var(--color-pink)] text-white animate-pulse'
                    : 'bg-[var(--color-pink)]/15 text-[var(--color-pink)]'
                }`}
              >
                <span aria-hidden>⏰</span>
                {s.rawStreak.current}-Tage-{g.name}-Streak — heute spielen!
              </Link>
            );
          })}
        </div>
      )}

      {/* Recoverable streak banner — exactly one missed day, freeze available. */}
      {canRecover && (
        <div className="mb-4 flex flex-col items-center gap-2 rounded-lg border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/[0.06] p-3 text-center">
          <p className="text-sm">
            <span aria-hidden>🃏</span>{' '}
            <span className="font-semibold">Streak in Gefahr.</span>
            {' '}Du hast {recoverableGames.length === 1
              ? `einen ${recoverableGames[0].name}-Streak`
              : `${recoverableGames.length} Streaks`}
            {' '}gestern verpasst. Joker einsetzen?
          </p>
          <p className="text-xs text-[var(--color-gray-text)]">
            {freezesBanked} Joker verfügbar
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {recoverableGames.map((g) => (
              <button
                key={g.gameType}
                type="button"
                onClick={() => setFreezeModalGame(g)}
                className="rounded bg-[var(--color-cyan)] px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
              >
                {g.name} retten ({statuses[g.gameType].recoverable!.current} Tage)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sponsor bar */}
      <AdSlot type="sponsor-bar" className="mb-5" />

      {/* Game cards */}
      <div className="flex flex-col gap-3">
        {GAMES.map((game) => {
          const status = statuses[game.gameType];
          const played = status.playedToday;
          const result = status.result;

          const inProgress = status.inProgress;
          const ariaStatus = played ? 'gespielt' : inProgress ? 'läuft' : 'nicht gestartet';
          return (
            <Link
              key={game.path}
              to={game.path}
              aria-label={`${game.name}: ${ariaStatus}`}
              className={`group flex items-center gap-4 rounded-lg border-2 p-4 transition-all duration-[var(--transition-fast)] ${
                played
                  ? 'border-[var(--color-green)]/30 bg-[var(--color-green)]/[0.03]'
                  : status.riskLevel !== 'safe'
                    ? 'border-[var(--color-pink)]/50 bg-[var(--color-pink)]/[0.03]'
                    : inProgress
                      ? 'border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/[0.03]'
                      : 'border-[var(--color-gray-bg)] hover:border-[var(--color-cyan)] hover:shadow-sm'
              }`}
            >
              <span
                className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-2xl transition-transform group-hover:scale-105 ${
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
                  ) : inProgress ? (
                    <span className="rounded bg-[var(--color-cyan)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      LÄUFT
                    </span>
                  ) : (
                    <span className="rounded bg-[var(--color-gray-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-gray-text)]">
                      OFFEN
                    </span>
                  )}
                  {status.streak.current >= 2 && (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-[var(--color-pink)]">
                      &#x1F525; {status.streak.current}
                    </span>
                  )}
                </div>
                {result ? (
                  <p className="mt-0.5 text-sm font-semibold text-[var(--color-black)]">
                    {result.summary}
                    {result.emojiLine && (
                      <span className="ml-2 text-xs tracking-wide">
                        {result.emojiLine.split('\n')[0]}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm text-[var(--color-gray-text)]">
                    {played
                      ? 'Weiter spielen oder Ergebnis ansehen'
                      : inProgress
                        ? 'Weiter spielen — Spielstand gespeichert'
                        : game.description}
                  </p>
                )}
              </div>
              <span className="text-[var(--color-gray-text)] transition-transform group-hover:translate-x-1 shrink-0">
                &rarr;
              </span>
            </Link>
          );
        })}
      </div>

      {/* Daily sweep celebration */}
      {allPlayed && hasAnyResult && (
        <div className="mt-6 animate-[popIn_400ms_ease-out] rounded-xl border-2 border-[var(--color-pink)]/20 bg-gradient-to-br from-[var(--color-pink)]/[0.04] to-[var(--color-cyan)]/[0.04] p-5 text-center">
          <p className="text-2xl" aria-hidden>&#x1F389;</p>
          <h3 className="mt-1 font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-pink)]">
            Tages-Sweep!
          </h3>
          <p className="mt-1 text-sm text-[var(--color-gray-text)]">
            Alle {GAMES.length} Spiele geschafft. Starke Leistung!
          </p>

          {/* Mini results grid */}
          <div className="mx-auto mt-3 flex max-w-[280px] flex-col gap-1.5">
            {GAMES.map((game) => {
              const r = statuses[game.gameType].result;
              if (!r) return null;
              return (
                <div key={game.gameType} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="mr-1.5">{game.emoji}</span>
                    <span className="font-semibold">{game.name}</span>
                  </span>
                  <span className="text-xs text-[var(--color-gray-text)]">{r.summary}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <ShareButton
              text={buildDailySweepShareText(statuses)}
              label="Tages-Ergebnis teilen"
              game="verbindige"
            />
          </div>
        </div>
      )}

      {/* Simple "all played" when no results stored */}
      {allPlayed && !hasAnyResult && (
        <div className="mt-5 rounded-lg bg-[var(--color-green)]/[0.06] p-4 text-center">
          <p className="text-sm font-semibold">
            Alle Spiele gespielt!
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-gray-text)]">
            Morgen gibt&apos;s neue R\u00E4tsel. Bis denn!
          </p>
        </div>
      )}

      {/* Next puzzle countdown */}
      {allPlayed && (
        <div className="mt-4 text-center animate-[resultSlideUp_400ms_ease-out_200ms_both]">
          <p className="text-xs text-[var(--color-gray-text)]">
            Neue R\u00E4tsel in{' '}
            <span className="font-semibold text-[var(--color-black)]">
              {countdown}
            </span>
          </p>
        </div>
      )}

      {/* Post-game MREC */}
      <div className="mt-8 flex justify-center">
        <AdSlot type="mrec" />
      </div>

      {freezeModalGame && (
        <StreakFreezeModal
          gameType={freezeModalGame.gameType}
          gameName={freezeModalGame.name}
          recoverable={statuses[freezeModalGame.gameType].recoverable!}
          freezesBanked={freezesBanked}
          onClose={() => setFreezeModalGame(null)}
          onApplied={() => {
            setFreezeModalGame(null);
            reloadStatuses();
          }}
        />
      )}
    </GameShell>
  );
}
