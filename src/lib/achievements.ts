/**
 * Achievements registry + detection + unlock writer.
 *
 * Detection runs from each game's completion path (after recordGamePlayed +
 * saveDailyResult). It reads the latest streak/history snapshot, computes
 * which achievements are now newly satisfied, persists each unlock locally
 * (and on the server when authed), and dispatches a UI event for the host.
 */
import { supabase } from '@/lib/supabase';
import { getStreak } from '@/lib/streaks';
import { getDailyResults, getPlayHistory } from '@/lib/dailyResults';
import { logEvent } from '@/lib/events';

export type AchievementTier = 1 | 2 | 3;

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tier: AchievementTier;
}

/**
 * Launch set — 11 badges across three tiers. Tier 1 = early hooks
 * (everyone earns one within 1–3 plays), tier 2 = engagement, tier 3 =
 * commitment. Adding new badges is additive; never reorder existing IDs.
 */
export const ACHIEVEMENTS: readonly Achievement[] = [
  // Tier 1 — fast hooks
  { id: 'first_play',         name: 'Erstes Spiel',     description: 'Dein erstes Watson-Rätsel.',                     emoji: '🎯', tier: 1 },
  { id: 'first_win',          name: 'Erster Sieg',      description: 'Erstes Spiel gewonnen.',                          emoji: '🏆', tier: 1 },
  { id: 'streak_3',           name: '3-Tage-Streak',    description: '3 Tage in Folge gespielt.',                       emoji: '🔥', tier: 1 },

  // Tier 2 — engagement
  { id: 'streak_7',           name: 'Wochen-Streak',    description: '7 Tage in Folge gespielt.',                       emoji: '🔥', tier: 2 },
  { id: 'daily_sweep',        name: 'Tages-Sweep',      description: 'Alle drei Spiele am gleichen Tag gespielt.',      emoji: '🎉', tier: 2 },
  { id: 'perfect_verbindige', name: 'Verbindige perfekt', description: 'Verbindige ohne Fehler abgeschlossen.',         emoji: '⭐', tier: 2 },
  { id: 'perfect_schlagloch', name: 'Schlagloch perfekt', description: 'Alle Schlagloch-Schlagzeilen richtig erraten.', emoji: '⭐', tier: 2 },
  { id: 'mundart_master',     name: 'Mundart-Master',   description: 'Alle Mundart-Wörter eines Zämesetzli gefunden.',  emoji: '🇨🇭', tier: 2 },

  // Tier 3 — commitment
  { id: 'streak_30',          name: 'Monats-Streak',    description: '30 Tage in Folge gespielt.',                      emoji: '🔥', tier: 3 },
  { id: 'plays_100',          name: 'Hundertfacher',    description: '100 Rätsel gelöst.',                              emoji: '💯', tier: 3 },
  { id: 'perfect_sweep',      name: 'Perfekter Tag',    description: 'Alle drei Spiele am gleichen Tag perfekt.',       emoji: '✨', tier: 3 },
] as const;

const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

const STORAGE_KEY = 'watson_achievements';

interface UnlockRecord {
  unlocked_at: string;
}

type UnlockMap = Record<string, UnlockRecord>;

function loadUnlocks(): UnlockMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UnlockMap;
  } catch {
    return {};
  }
}

function saveUnlocks(map: UnlockMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/** Return all unlocked achievement IDs with their unlock timestamps. */
export function getUnlocks(): UnlockMap {
  return loadUnlocks();
}

export function isUnlocked(id: string): boolean {
  return id in loadUnlocks();
}

/**
 * Pull user's server unlocks on login and merge with local. Local wins on
 * conflicting timestamps (which doesn't really happen — same achievement
 * unlocked twice is fine).
 */
export async function reconcileAchievementsOnLogin(userId: string): Promise<void> {
  try {
    const { data: rows } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId);
    const local = loadUnlocks();
    let dirty = false;
    for (const row of rows ?? []) {
      const id = row.achievement_id as string;
      if (!local[id]) {
        local[id] = { unlocked_at: row.unlocked_at as string };
        dirty = true;
      }
    }
    if (dirty) saveUnlocks(local);

    // Also push any local-only unlocks to the server.
    const serverIds = new Set((rows ?? []).map((r) => r.achievement_id as string));
    const localOnly = Object.keys(local).filter((id) => !serverIds.has(id));
    for (const id of localOnly) {
      void supabase.from('user_achievements').upsert(
        { user_id: userId, achievement_id: id, unlocked_at: local[id].unlocked_at },
        { onConflict: 'user_id,achievement_id' },
      );
    }
  } catch {
    // non-critical
  }
}

/**
 * Compute which achievements should be unlocked given the current streak
 * and history snapshot. Returns the IDs that are newly unlocked (not in
 * the existing unlock map).
 */
function detectNewlyUnlocked(): string[] {
  const existing = loadUnlocks();
  const out: string[] = [];

  const today = getDailyResults();
  const history = getPlayHistory();

  // Aggregate signals once.
  const allDayResults = Object.values(history).flatMap((day) =>
    Object.values(day),
  );
  const totalPlays = allDayResults.length;
  const anyWin = allDayResults.some((r) => r.outcome === 'won' || r.outcome === 'complete');
  const anyPlay = totalPlays > 0;

  const verbStreak = getStreak('verbindige').current;
  const schlStreak = getStreak('schlagloch').current;
  const zaemStreak = getStreak('zaemesetzli').current;
  const maxStreak = Math.max(verbStreak, schlStreak, zaemStreak);

  // Today's daily sweep
  const allThreeToday =
    today.results.verbindige && today.results.schlagloch && today.results.zaemesetzli;

  // Any past day with all 3 games
  const anySweep = Object.values(history).some(
    (day) => day.verbindige && day.schlagloch && day.zaemesetzli,
  );

  // Any past day with all 3 games perfect
  const anyPerfectSweep = Object.values(history).some((day) => {
    return (
      day.verbindige?.perfect === true &&
      day.schlagloch?.perfect === true &&
      day.zaemesetzli?.perfect === true
    );
  });

  // Any-time perfects per game
  const anyPerfectVerbindige = Object.values(history).some((day) => day.verbindige?.perfect === true);
  const anyPerfectSchlagloch = Object.values(history).some((day) => day.schlagloch?.perfect === true);
  const anyAllMundart = Object.values(history).some((day) => day.zaemesetzli?.allMundart === true);

  function maybeUnlock(id: string, condition: boolean) {
    if (!condition) return;
    if (existing[id]) return;
    out.push(id);
  }

  maybeUnlock('first_play', anyPlay);
  maybeUnlock('first_win', anyWin);
  maybeUnlock('streak_3', maxStreak >= 3);
  maybeUnlock('streak_7', maxStreak >= 7);
  maybeUnlock('streak_30', maxStreak >= 30);
  maybeUnlock('daily_sweep', !!allThreeToday || anySweep);
  maybeUnlock('perfect_verbindige', anyPerfectVerbindige);
  maybeUnlock('perfect_schlagloch', anyPerfectSchlagloch);
  maybeUnlock('mundart_master', anyAllMundart);
  maybeUnlock('plays_100', totalPlays >= 100);
  maybeUnlock('perfect_sweep', anyPerfectSweep);

  return out;
}

const EVENT_NAME = 'watson:achievement-unlocked';

export interface AchievementUnlockedEvent {
  achievement: Achievement;
}

/**
 * Run detection. For every newly-unlocked achievement: persist locally,
 * mirror to Supabase if authed, log a `achievement_unlocked` event, and
 * dispatch a UI event so the host can render a celebration.
 */
export async function checkAchievements(): Promise<Achievement[]> {
  const newIds = detectNewlyUnlocked();
  if (newIds.length === 0) return [];

  const unlocks = loadUnlocks();
  const now = new Date().toISOString();
  for (const id of newIds) {
    unlocks[id] = { unlocked_at: now };
  }
  saveUnlocks(unlocks);

  const newly: Achievement[] = newIds
    .map((id) => ACHIEVEMENT_BY_ID.get(id))
    .filter((a): a is Achievement => Boolean(a));

  // Mirror to Supabase if authed (fire-and-forget).
  void mirrorToServer(newIds, now);

  // Dispatch one event per unlock (with a small stagger so they queue).
  newly.forEach((achievement, i) => {
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent<AchievementUnlockedEvent>(EVENT_NAME, {
          detail: { achievement },
        }),
      );
    }, i * 1200);
    void logEvent('achievement_unlocked', {
      payload: { id: achievement.id, tier: achievement.tier },
    });
  });

  return newly;
}

async function mirrorToServer(ids: string[], unlockedAt: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const rows = ids.map((id) => ({
      user_id: user.id,
      achievement_id: id,
      unlocked_at: unlockedAt,
    }));
    await supabase.from('user_achievements').upsert(rows, {
      onConflict: 'user_id,achievement_id',
    });
  } catch {
    // ignore
  }
}

export const ACHIEVEMENT_EVENT_NAME = EVENT_NAME;
