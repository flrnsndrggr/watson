import { useEffect, useRef } from 'react';
import { markHowToPlaySeen } from '@/lib/howToPlayStorage';

export interface HowToPlayStep {
  icon: string;
  text: string;
}

interface HowToPlayModalProps {
  gameId: string;
  title: string;
  steps: HowToPlayStep[];
  onClose: () => void;
}

export function HowToPlayModal({ gameId, title, steps, onClose }: HowToPlayModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus the close button on mount, mark as seen
  useEffect(() => {
    closeRef.current?.focus();
    markHowToPlaySeen(gameId);
  }, [gameId]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`So funktioniert ${title}`}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl animate-[popIn_300ms_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold">
            So funktioniert&rsquo;s
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-gray-text)] hover:bg-[var(--color-gray-bg)] transition-colors"
            aria-label="Schliessen"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-gray-bg)] text-base"
                aria-hidden="true"
              >
                {step.icon}
              </span>
              <p className="text-sm leading-relaxed pt-1">{step.text}</p>
            </li>
          ))}
        </ol>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded bg-[var(--color-cyan)] py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity cursor-pointer"
        >
          Los geht&rsquo;s!
        </button>
      </div>
    </div>
  );
}
