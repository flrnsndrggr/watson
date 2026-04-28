import { useEffect, useState } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  fading?: boolean;
}

let toastId = 0;
const listeners = new Set<(msg: ToastMessage) => void>();

export function showToast(text: string) {
  const msg = { id: ++toastId, text };
  listeners.forEach((fn) => fn(msg));
}

const MAX_VISIBLE_TOASTS = 3;

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setToasts((prev) => {
        const next = [...prev, msg];
        // Evict oldest non-fading toasts when exceeding max
        if (next.length > MAX_VISIBLE_TOASTS) {
          return next.slice(-MAX_VISIBLE_TOASTS);
        }
        return next;
      });
      setTimeout(() => {
        setToasts((prev) => prev.map((t) => t.id === msg.id ? { ...t, fading: true } : t));
      }, 2500);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 3000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed top-[100px] left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded bg-[var(--color-nav-bg)] px-4 py-2 text-sm font-semibold text-white ${
            t.fading
              ? 'animate-[fadeOut_500ms_ease-in_forwards]'
              : 'animate-[popIn_var(--transition-normal)]'
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
