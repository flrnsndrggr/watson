import { useState } from 'react';
import { useUserAuth } from '@/lib/userAuthContext';
import {
  dismissAccountPrompt,
  markAccountPromptConverted,
} from '@/lib/promptGate';
import { logEvent } from '@/lib/events';

interface AccountPromptModalProps {
  triggerStreak: number;
  onClose: () => void;
}

type Step = 'pitch' | 'email' | 'sent' | 'error';

/**
 * Surfaces after a meaningful streak milestone for anon users — invites them
 * to sign up to preserve the streak across devices.
 *
 * Uses the same magic-link flow as AuthModal but with copy tuned to the
 * streak-saving message and a "Später" suppression button.
 */
export function AccountPromptModal({
  triggerStreak,
  onClose,
}: AccountPromptModalProps) {
  const { signInWithMagicLink } = useUserAuth();
  const [step, setStep] = useState<Step>('pitch');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleDismiss() {
    dismissAccountPrompt();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSubmitting(true);
    const { error } = await signInWithMagicLink(trimmed);
    setSubmitting(false);
    if (error) {
      setErrorMsg(error);
      setStep('error');
      return;
    }
    markAccountPromptConverted();
    setStep('sent');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Konto erstellen"
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'pitch' && (
          <>
            <div className="text-center">
              <div className="text-4xl" aria-hidden>🔥</div>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-xl font-bold">
                Du bist auf einem Lauf.
              </h2>
              <p className="mt-2 text-sm text-[var(--color-gray-text)]">
                <span className="font-semibold text-[var(--color-pink)]">{triggerStreak} Tage in Folge</span>{' '}
                gespielt. Erstelle ein Konto, dann sind dein Streak und deine Highscores
                gesichert — auf jedem Gerät.
              </p>
            </div>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => {
                  void logEvent('account_prompt_step_email');
                  setStep('email');
                }}
                className="w-full rounded bg-[var(--color-cyan)] py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Konto erstellen
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full rounded border border-[var(--color-gray-bg)] py-2.5 text-sm font-semibold text-[var(--color-gray-text)] transition-colors hover:bg-[var(--color-gray-bg)]"
              >
                Später
              </button>
            </div>
          </>
        )}

        {step === 'email' && (
          <form onSubmit={handleSubmit}>
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold">
              E-Mail eingeben
            </h2>
            <p className="mt-1 text-sm text-[var(--color-gray-text)]">
              Wir schicken dir einen Magic Link — kein Passwort nötig.
            </p>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              className="mt-3 w-full rounded border border-[var(--color-gray-bg)] px-3 py-2 text-sm focus:border-[var(--color-cyan)] focus:outline-none focus:ring-1 focus:ring-[var(--color-cyan)]"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setStep('pitch')}
                disabled={submitting}
                className="flex-1 rounded border border-[var(--color-gray-bg)] py-2.5 text-sm font-semibold text-[var(--color-gray-text)] transition-colors hover:bg-[var(--color-gray-bg)] disabled:opacity-50"
              >
                Zurück
              </button>
              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="flex-1 rounded bg-[var(--color-cyan)] py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Wird gesendet …' : 'Magic Link senden'}
              </button>
            </div>
          </form>
        )}

        {step === 'sent' && (
          <div className="text-center">
            <div className="text-4xl" aria-hidden>✉️</div>
            <h2 className="mt-2 font-[family-name:var(--font-heading)] text-lg font-bold">
              Check deine Inbox!
            </h2>
            <p className="mt-2 text-sm text-[var(--color-gray-text)]">
              Wir haben einen Login-Link an{' '}
              <span className="font-semibold text-[var(--color-black)]">{email}</span>{' '}
              geschickt. Klick den Link, um dein Konto zu aktivieren.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded bg-[var(--color-cyan)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Schliessen
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center">
            <div className="text-4xl" aria-hidden>😕</div>
            <h2 className="mt-2 font-[family-name:var(--font-heading)] text-lg font-bold">
              Etwas ist schiefgelaufen
            </h2>
            <p className="mt-2 text-sm text-[var(--color-pink)]">{errorMsg}</p>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setErrorMsg('');
              }}
              className="mt-5 rounded bg-[var(--color-cyan)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Nochmals versuchen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
