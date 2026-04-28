/**
 * Single event log for the gamification layer. Drives every later analytics
 * question (streak revival rate, account-prompt funnel, freeze adoption).
 *
 * Insert-only, fire-and-forget. Failures never block the UI.
 */
import { supabase } from './supabase';

const ANON_ID_KEY = 'watson_anon_id';

function getAnonId(): string {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return '00000000-0000-0000-0000-000000000000';
  }
}

interface LogEventOptions {
  /** Free-form game tag — accepts GameType or any leaderboard variant. */
  gameType?: string;
  payload?: Record<string, unknown>;
}

/**
 * Append a row to gamification_events. Resolves the user's auth state at call
 * time; anonymous events get a stable anon_id (localStorage uuid) so we can
 * thread a session before sign-in.
 */
export async function logEvent(
  type: string,
  options: LogEventOptions = {},
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('gamification_events').insert({
      user_id: user?.id ?? null,
      anon_id: user ? null : getAnonId(),
      event_type: type,
      game_type: options.gameType ?? null,
      payload: options.payload ?? {},
    });
  } catch {
    // never block the UI on telemetry
  }
}
