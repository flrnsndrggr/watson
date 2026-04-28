import type { GameType, StreakData } from '@/types';
import { getTodayDateCET } from '@/lib/dateUtils';
import { supabase } from '@/lib/supabase';
import { logEvent } from '@/lib/events';

const STORAGE_KEY = 'watson_streaks';
const FREEZES_KEY = 'watson_streak_freezes';
const FREEZE_MILESTONE_KEY = 'watson_streak_freeze_milestones';

const FREEZES_CAP = 2;

type StreakStore = Partial<Record<GameType, StreakData>>;

function loadStreaks(): StreakStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StreakStore;
  } catch {
    return {};
  }
}

function saveStreaks(store: StreakStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/** Returns yesterday's date in YYYY-MM-DD (Europe/Zurich). */
function getYesterdayDateCET(): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86_400_000);
  return yesterday.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
}

/** Returns the date that's `days` days before today (Europe/Zurich). */
function getCETDateDaysAgo(days: number): string {
  const now = new Date();
  const past = new Date(now.getTime() - days * 86_400_000);
  return past.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
}

/**
 * Get the current streak data for a game.
 * If the streak is stale (last_played is older than yesterday), resets current to 0.
 */
export function getStreak(gameType: GameType): StreakData {
  const store = loadStreaks();
  const data = store[gameType];

  if (!data) {
    return { current: 0, longest: 0, last_played: '' };
  }

  const today = getTodayDateCET();
  const yesterday = getYesterdayDateCET();

  if (data.last_played === today || data.last_played === yesterday) {
    return data;
  }

  return { current: 0, longest: data.longest, last_played: data.last_played };
}

/**
 * Get the *raw* stored streak without the today/yesterday auto-reset. Used by
 * the recoverable-streak detection so the freeze prompt can see what was lost.
 */
export function getStreakRaw(gameType: GameType): StreakData {
  const store = loadStreaks();
  return store[gameType] ?? { current: 0, longest: 0, last_played: '' };
}

/**
 * Record that a game was played today. Side effects: emits a `streak_played`
 * event, banks a freeze when crossing a 7-day milestone, mirrors the write to
 * Supabase if the user is authed. Safe to call multiple times per day.
 */
export function recordGamePlayed(gameType: GameType): StreakData {
  const store = loadStreaks();
  const existing = store[gameType];
  const today = getTodayDateCET();
  const yesterday = getYesterdayDateCET();

  if (existing?.last_played === today) {
    return existing;
  }

  let newCurrent: number;
  if (existing && existing.last_played === yesterday) {
    newCurrent = existing.current + 1;
  } else {
    newCurrent = 1;
  }

  const longestSoFar = existing?.longest ?? 0;
  const newLongest = Math.max(longestSoFar, newCurrent);

  const updated: StreakData = {
    current: newCurrent,
    longest: newLongest,
    last_played: today,
  };

  store[gameType] = updated;
  saveStreaks(store);

  void logEvent('streak_played', {
    gameType,
    payload: { current: newCurrent, longest: newLongest },
  });
  if (newCurrent > 0 && newCurrent % 7 === 0) {
    void maybeBankFreezeForMilestone(gameType, newCurrent);
  }
  void syncStreakToServerIfAuthed(gameType, updated);

  return updated;
}

// ===== Streak freezes =====

interface FreezesState {
  banked: number;
}

function loadFreezesLocal(): FreezesState {
  try {
    const raw = localStorage.getItem(FREEZES_KEY);
    if (!raw) return { banked: 0 };
    return JSON.parse(raw) as FreezesState;
  } catch {
    return { banked: 0 };
  }
}

function saveFreezesLocal(state: FreezesState): void {
  try {
    localStorage.setItem(FREEZES_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function loadMilestonesAwarded(): Record<string, number> {
  try {
    const raw = localStorage.getItem(FREEZE_MILESTONE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function saveMilestonesAwarded(map: Record<string, number>): void {
  try {
    localStorage.setItem(FREEZE_MILESTONE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * Bank one freeze (capped at FREEZES_CAP) when a (game, milestone) pair has
 * not been rewarded yet. Idempotent.
 */
async function maybeBankFreezeForMilestone(
  gameType: GameType,
  milestone: number,
): Promise<void> {
  const milestones = loadMilestonesAwarded();
  const key = `${gameType}:${milestone}`;
  if (milestones[key]) return;
  milestones[key] = Date.now();
  saveMilestonesAwarded(milestones);

  const current = await getFreezesBanked();
  const next = Math.min(current + 1, FREEZES_CAP);
  if (next === current) return;
  await setFreezesBanked(next);

  void logEvent('freeze_earned', {
    gameType,
    payload: { milestone, banked_after: next },
  });
}

/**
 * Read current banked freeze count. Server takes precedence when authed,
 * otherwise localStorage.
 */
export async function getFreezesBanked(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('streak_freezes_banked')
        .eq('id', user.id)
        .maybeSingle();
      const serverVal = (data?.streak_freezes_banked as number | undefined) ?? null;
      if (serverVal !== null) return serverVal;
    }
  } catch {
    // fall through to local
  }
  return loadFreezesLocal().banked;
}

/** Synchronous read for use in render — server reconciliation runs separately. */
export function getFreezesBankedSync(): number {
  return loadFreezesLocal().banked;
}

/** Persist new freeze count both locally and (if authed) on the server. */
export async function setFreezesBanked(n: number): Promise<void> {
  saveFreezesLocal({ banked: n });
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('user_profiles')
      .upsert({ id: user.id, streak_freezes_banked: n });
  } catch {
    // ignore
  }
}

/**
 * Whether the user has a *recoverable* streak for this game right now: they
 * had a streak ≥ 1, missed exactly one day (yesterday), and have a freeze.
 *
 * Returns the raw (pre-reset) streak data when recoverable, else null.
 */
export function getRecoverableStreak(gameType: GameType): StreakData | null {
  const raw = getStreakRaw(gameType);
  if (raw.current < 1) return null;
  if (!raw.last_played) return null;
  const dayBeforeYesterday = getCETDateDaysAgo(2);
  if (raw.last_played !== dayBeforeYesterday) return null;
  return raw;
}

/**
 * Apply a Joker for a recoverable streak: treat yesterday as played so the
 * next play continues the streak. Decrements freeze bank. No-op if the streak
 * is no longer recoverable.
 */
export async function applyStreakFreeze(gameType: GameType): Promise<boolean> {
  const recoverable = getRecoverableStreak(gameType);
  if (!recoverable) return false;
  const banked = await getFreezesBanked();
  if (banked < 1) return false;

  const yesterday = getYesterdayDateCET();
  const store = loadStreaks();
  store[gameType] = { ...recoverable, last_played: yesterday };
  saveStreaks(store);
  await setFreezesBanked(banked - 1);

  void syncStreakToServerIfAuthed(gameType, store[gameType]!);
  void logEvent('freeze_used', {
    gameType,
    payload: { saved_streak: recoverable.current, banked_after: banked - 1 },
  });
  return true;
}

// ===== Server sync =====

/** Mirror local streak data to Supabase if the user is authed. */
async function syncStreakToServerIfAuthed(
  gameType: GameType,
  data: StreakData,
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('streaks').upsert(
      {
        user_id: user.id,
        game_type: gameType,
        current_streak: data.current,
        longest_streak: data.longest,
        last_played: data.last_played || getTodayDateCET(),
      },
      { onConflict: 'user_id,game_type' },
    );
  } catch {
    // non-critical
  }
}

/**
 * On login: pull server streaks, merge with localStorage by taking max of
 * (current, longest) and the latest last_played. Write merged values to both.
 */
export async function reconcileStreaksOnLogin(userId: string): Promise<void> {
  try {
    const { data: rows } = await supabase
      .from('streaks')
      .select('game_type, current_streak, longest_streak, last_played')
      .eq('user_id', userId);

    const local = loadStreaks();
    const games: GameType[] = ['verbindige', 'zaemesetzli', 'schlagloch'];

    for (const game of games) {
      const localData = local[game] ?? { current: 0, longest: 0, last_played: '' };
      const serverRow = (rows ?? []).find((r) => (r.game_type as string) === game);
      const serverData: StreakData | null = serverRow
        ? {
            current: serverRow.current_streak as number,
            longest: serverRow.longest_streak as number,
            last_played: serverRow.last_played as string,
          }
        : null;

      const merged: StreakData = {
        current: Math.max(localData.current, serverData?.current ?? 0),
        longest: Math.max(localData.longest, serverData?.longest ?? 0),
        last_played:
          localData.last_played > (serverData?.last_played ?? '')
            ? localData.last_played
            : (serverData?.last_played ?? ''),
      };

      const localChanged =
        merged.current !== localData.current ||
        merged.longest !== localData.longest ||
        merged.last_played !== localData.last_played;
      if (localChanged) local[game] = merged;

      const serverChanged =
        !serverData ||
        merged.current !== serverData.current ||
        merged.longest !== serverData.longest ||
        merged.last_played !== serverData.last_played;
      if (serverChanged) await syncStreakToServerIfAuthed(game, merged);
    }
    saveStreaks(local);
    void logEvent('streaks_reconciled', { payload: { user_id: userId } });
  } catch {
    // non-critical
  }
}
