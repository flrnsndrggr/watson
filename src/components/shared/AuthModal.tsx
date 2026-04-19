import { useState } from 'react';
import { useUserAuth } from '@/lib/userAuth';

interface AuthModalProps {
  onClose: () => void;
}

type Step = 'email' | 'sent' | 'error';

export function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithMagicLink } = useUserAuth();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    } else {
      setStep('sent');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Anmelden"
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'email' && (
          <>
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold">
              Anmelden
            </h2>
            <p className="mt-1 text-sm text-[var(--color-gray-text)]">
              Gib deine E-Mail-Adresse ein. Du erhältst einen Magic Link zum
              Einloggen &mdash; kein Passwort nötig.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  E-Mail
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-cyan)] focus:outline-none focus:ring-1 focus:ring-[var(--color-cyan)]"
                  autoFocus
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="w-full rounded bg-[var(--color-cyan)] py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Wird gesendet...' : 'Magic Link senden'}
              </button>
            </form>
          </>
        )}

        {step === 'sent' && (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✉️</div>
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold">
              Check deine Inbox!
            </h2>
            <p className="mt-2 text-sm text-[var(--color-gray-text)]">
              Wir haben einen Login-Link an{' '}
              <span className="font-semibold text-[var(--color-black)]">
                {email}
              </span>{' '}
              geschickt. Klick den Link, um dich anzumelden.
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded bg-[var(--color-cyan)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              Schliessen
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">😕</div>
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold">
              Etwas ist schiefgelaufen
            </h2>
            <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
            <button
              onClick={() => {
                setStep('email');
                setErrorMsg('');
              }}
              className="mt-5 rounded bg-[var(--color-cyan)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              Nochmals versuchen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
