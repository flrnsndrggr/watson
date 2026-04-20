import { useState } from 'react';
import { share } from '@/lib/share';

interface ShareButtonProps {
  text: string;
  label?: string;
}

export function ShareButton({ text, label = 'Teilen' }: ShareButtonProps) {
  const [feedback, setFeedback] = useState<'shared' | 'copied' | null>(null);

  async function handleShare() {
    const result = await share(text);
    setFeedback(result);
    setTimeout(() => setFeedback(null), 2000);
  }

  const feedbackLabel = feedback === 'shared' ? 'Geteilt!' : feedback === 'copied' ? 'Kopiert!' : null;

  return (
    <button
      onClick={handleShare}
      className="rounded bg-[var(--color-cyan)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 active:scale-[0.97]"
    >
      {feedbackLabel ?? label}
    </button>
  );
}
