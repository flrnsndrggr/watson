import { useEffect, useState } from 'react';

interface ToastMessage {
  id: number;
  text: string;
}

let toastId = 0;
const listeners = new Set<(msg: ToastMessage) => void>();

export function showToast(text: string) {
  const msg = { id: ++toastId, text };
  listeners.forEach((fn) => fn(msg));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 2000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  return (
    <div className="pointer-events-none fixed top-[100px] left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto rounded bg-[var(--color-nav-bg)] px-4 py-2 text-sm font-semibold text-white animate-[popIn_var(--transition-normal)]"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
