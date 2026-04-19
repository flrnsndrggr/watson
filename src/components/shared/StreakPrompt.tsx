import { useState } from 'react';
import { useUserAuth } from '@/lib/userAuthContext';
import { AuthModal } from './AuthModal';
import type { StreakData } from '@/types';

const DISMISS_KEY = 'watson_streak_prompt_dismissed';

interface StreakPromptProps {
  streak: StreakData;
}

/**
 * Shows a sign-up prompt when a user has a streak >= 3 but is not logged in.
 * Dismissible — once dismissed, stays hidden for the session.
 */
export function StreakPrompt({ streak }: StreakPromptProps) {
  const { user, loading } = useUserAuth();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [showAuth, setShowAuth] = useState(false);

  // Don't show if: loading, user is logged in, streak < 3, or dismissed
  if (loading || user || streak.current < 3 || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // sessionStorage unavailable — just hide for this render
    }
  }

  return (
    <>
      <div className="mx-auto mt-4 w-full max-w-sm rounded-lg border border-[var(--color-cyan)]/20 bg-[var(--color-cyan)]/5 px-4 py-3 text-center">
        <p className="text-sm font-semibold text-[var(--color-black)]">
          🔥 {streak.current} Tage Streak!
        </p>
        <p className="mt-1 text-xs text-[var(--color-gray-text)]">
          Willst du deinen Streak behalten? Erstell ein Konto, damit dein
          Fortschritt nicht verloren geht.
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={() => setShowAuth(true)}
            className="rounded bg-[var(--color-cyan)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            Konto erstellen
          </button>
          <button
            onClick={handleDismiss}
            className="rounded px-3 py-2 text-xs text-[var(--color-gray-text)] hover:text-[var(--color-black)] transition-colors cursor-pointer"
          >
            Später
          </button>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
