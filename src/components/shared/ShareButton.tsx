import { useState } from 'react';
import { share } from '@/lib/share';

interface ShareButtonProps {
  text: string;
  label?: string;
}

export function ShareButton({ text, label = 'Teilen' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    await share(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="rounded bg-[var(--color-cyan)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 active:scale-[0.97]"
    >
      {copied ? 'Kopiert!' : label}
    </button>
  );
}
