import { useState } from 'react';
import { applyStreakFreeze } from '@/lib/streaks';
import type { GameType, StreakData } from '@/types';

interface StreakFreezeModalProps {
  gameType: GameType;
  gameName: string;
  recoverable: StreakData;
  freezesBanked: number;
  onClose: () => void;
  onApplied: () => void;
}

/**
 * Offered when a recoverable streak exists (missed exactly one day, banked
 * freeze ≥ 1). Applying treats yesterday as played so the streak survives;
 * the next play continues from there.
 */
export function StreakFreezeModal({
  gameType,
  gameName,
  recoverable,
  freezesBanked,
  onClose,
  onApplied,
}: StreakFreezeModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setSubmitting(true);
    setError(null);
    const ok = await applyStreakFreeze(gameType);
    setSubmitting(false);
    if (!ok) {
      setError('Joker konnte nicht eingesetzt werden — bitte neu laden.');
      return;
    }
    onApplied();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Streak retten"
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-4xl" aria-hidden>🃏</div>
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-lg font-bold">
            Joker einsetzen?
          </h2>
          <p className="mt-2 text-sm text-[var(--color-gray-text)]">
            Du hast gestern <span className="font-semibold text-[var(--color-black)]">{gameName}</span> verpasst.
            Setz einen Joker ein, um deinen{' '}
            <span className="font-semibold text-[var(--color-pink)]">
              {recoverable.current}-Tage-Streak
            </span>{' '}
            zu retten.
          </p>
          <p className="mt-3 text-xs text-[var(--color-gray-text)]">
            Verfügbar: {freezesBanked} Joker
            {' · '}Verdienst: alle 7 Streak-Tage einer (max. 2 gespart)
          </p>
        </div>

        {error && (
          <p className="mt-3 rounded bg-[var(--color-pink)]/10 p-2 text-center text-xs text-[var(--color-pink)]">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded border border-[var(--color-gray-bg)] py-2.5 text-sm font-semibold text-[var(--color-gray-text)] transition-colors hover:bg-[var(--color-gray-bg)] disabled:opacity-50"
          >
            Nicht jetzt
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={submitting}
            className="flex-1 rounded bg-[var(--color-cyan)] py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Joker …' : 'Joker einsetzen'}
          </button>
        </div>
      </div>
    </div>
  );
}
