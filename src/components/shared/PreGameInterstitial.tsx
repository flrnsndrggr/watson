import { useState, useEffect, useCallback } from 'react';
import { AdSlot } from './AdSlot';

const COUNTDOWN_SECONDS = 5;

/**
 * Pre-game interstitial ad overlay shown once per session on mobile.
 * Displays a 5-second countdown before the user can dismiss.
 */
export function PreGameInterstitial({ onDismiss }: { onDismiss: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleSkip = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-black)]/80 p-6"
      role="dialog"
      aria-label="Werbung"
      aria-modal="true"
    >
      <div className="flex w-full max-w-[340px] flex-col items-center gap-6">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
          Anzeige
        </span>

        <AdSlot type="interstitial" className="h-[400px] w-full max-w-[300px]" />

        {secondsLeft > 0 ? (
          <span className="text-sm text-white/60">
            Weiter in {secondsLeft}…
          </span>
        ) : (
          <button
            type="button"
            onClick={handleSkip}
            className="min-h-[44px] min-w-[44px] rounded-full bg-white px-6 py-2 font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-black)] transition-opacity hover:opacity-80 active:opacity-70"
            aria-label="Werbung überspringen"
          >
            Weiter zum Spiel
          </button>
        )}
      </div>
    </div>
  );
}
