import { useState } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  enableNotifications,
  hasEnabledNotifications,
  isPromptDismissed,
  dismissPrompt,
} from '@/lib/notifications';
import { showToast } from './Toast';
import { trackNotificationOptIn } from '@/lib/analytics';

/**
 * Shows a push notification opt-in prompt in the game result screen.
 * Hidden if: notifications unsupported, already enabled, already denied by browser,
 * or dismissed this session.
 */
export function NotificationPrompt() {
  const [dismissed, setDismissed] = useState(() => isPromptDismissed());
  const [enabling, setEnabling] = useState(false);

  // Don't show if already opted in, not supported, browser-denied, or dismissed
  if (
    !isNotificationSupported() ||
    hasEnabledNotifications() ||
    getNotificationPermission() === 'denied' ||
    dismissed
  ) {
    return null;
  }

  function handleDismiss() {
    setDismissed(true);
    dismissPrompt();
  }

  async function handleEnable() {
    setEnabling(true);
    const success = await enableNotifications('08:00');
    setEnabling(false);

    if (success) {
      showToast('Erinnerung aktiviert!');
      trackNotificationOptIn('game_result');
      setDismissed(true); // Hide prompt after success
    } else {
      showToast('Benachrichtigungen wurden blockiert.');
      handleDismiss();
    }
  }

  return (
    <div className="mx-auto mt-4 w-full max-w-sm rounded-lg border border-[var(--color-cyan)]/20 bg-[var(--color-cyan)]/5 px-4 py-3 text-center">
      <p className="text-sm font-semibold text-[var(--color-black)]">
        Tägliche Erinnerung
      </p>
      <p className="mt-1 text-xs text-[var(--color-gray-text)]">
        Verpasse kein Rätsel — wir erinnern dich jeden Tag, wenn ein neues Puzzle bereit ist.
      </p>
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          onClick={() => void handleEnable()}
          disabled={enabling}
          className="rounded bg-[var(--color-cyan)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          aria-label="Tägliche Erinnerung aktivieren"
        >
          {enabling ? 'Wird aktiviert\u2026' : 'Erinnere mich'}
        </button>
        <button
          onClick={handleDismiss}
          className="rounded px-3 py-2 text-xs text-[var(--color-gray-text)] hover:text-[var(--color-black)] transition-colors cursor-pointer"
        >
          Später
        </button>
      </div>
    </div>
  );
}
