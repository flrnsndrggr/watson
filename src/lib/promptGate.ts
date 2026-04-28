/**
 * Suppression timer for the "create an account" prompt. Once dismissed, we
 * don't re-show it for `SUPPRESS_DAYS`. Stored locally — the prompt is for
 * anonymous users by definition.
 */
import { supabase } from '@/lib/supabase';
import { logEvent } from '@/lib/events';

const DISMISS_KEY = 'watson_account_prompt_dismissed_at';
const SUPPRESS_DAYS = 14;
const TRIGGER_THRESHOLD = 3;

function readDismissedAt(): number | null {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeDismissedAt(ts: number): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(ts));
  } catch {
    // ignore
  }
}

/**
 * Decide whether to show the account prompt now.
 *
 * Returns true if:
 * - The user is NOT logged in
 * - The given `triggerStreak` is ≥ TRIGGER_THRESHOLD
 * - The prompt hasn't been dismissed in the last SUPPRESS_DAYS days
 */
export async function shouldShowAccountPrompt(
  triggerStreak: number,
): Promise<boolean> {
  if (triggerStreak < TRIGGER_THRESHOLD) return false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return false;
  } catch {
    // assume anon if auth check fails
  }

  const dismissedAt = readDismissedAt();
  if (dismissedAt) {
    const ageDays = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    if (ageDays < SUPPRESS_DAYS) return false;
  }
  return true;
}

/** Persist a dismissal so the prompt won't fire again for SUPPRESS_DAYS. */
export function dismissAccountPrompt(): void {
  writeDismissedAt(Date.now());
  void logEvent('account_prompt_dismissed');
}

/** Mark the prompt as converted (user submitted an email). */
export function markAccountPromptConverted(): void {
  // After conversion, the prompt is still "dismissed" for tracking purposes.
  writeDismissedAt(Date.now());
  void logEvent('account_prompt_converted');
}
