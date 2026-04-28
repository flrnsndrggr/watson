import { useEffect, useState } from 'react';
import { AccountPromptModal } from './AccountPromptModal';
import { shouldShowAccountPrompt } from '@/lib/promptGate';
import { logEvent } from '@/lib/events';

/**
 * Listens for `watson:trigger-account-prompt` custom events. When fired with a
 * streak ≥ TRIGGER_THRESHOLD and the user is anon and the prompt isn't
 * suppressed, mounts the AccountPromptModal.
 */
const EVENT_NAME = 'watson:trigger-account-prompt';

interface TriggerDetail {
  triggerStreak: number;
}

/**
 * Imperative trigger usable from any hook/component.
 *
 * Co-exporting a function alongside the component below disables HMR fast
 * refresh for this file — that's an acceptable trade for keeping the
 * trigger and the host wired together. The only consumer of fast refresh
 * here would be the host itself, which we rarely edit.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function triggerAccountPrompt(triggerStreak: number): void {
  window.dispatchEvent(
    new CustomEvent<TriggerDetail>(EVENT_NAME, { detail: { triggerStreak } }),
  );
}

export function AccountPromptHost() {
  const [open, setOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent<TriggerDetail>).detail;
      if (!detail) return;
      const ok = await shouldShowAccountPrompt(detail.triggerStreak);
      if (!ok) return;
      setStreak(detail.triggerStreak);
      setOpen(true);
      void logEvent('account_prompt_shown', {
        payload: { trigger_streak: detail.triggerStreak },
      });
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  if (!open) return null;
  return <AccountPromptModal triggerStreak={streak} onClose={() => setOpen(false)} />;
}
