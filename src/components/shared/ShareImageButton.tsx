import { useState } from 'react';
import { generateShareCard, type ShareCardData } from '@/lib/shareImage';
import { showToast } from '@/components/shared/Toast';
import { trackGameShared } from '@/lib/analytics';
import type { GameType } from '@/types';

interface ShareImageButtonProps {
  cardData: ShareCardData;
  game: GameType;
}

export function ShareImageButton({ cardData, game }: ShareImageButtonProps) {
  const [generating, setGenerating] = useState(false);

  async function handleClick() {
    if (generating) return;
    setGenerating(true);

    try {
      const blob = await generateShareCard(cardData);
      const file = new File([blob], `${game}-${cardData.puzzleId}.png`, {
        type: 'image/png',
      });

      // Prefer Web Share API with file support (mobile)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${cardData.gameName} #${cardData.puzzleId}`,
        });
        trackGameShared(game, 'share_image');
      } else {
        // Desktop fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${game}-${cardData.puzzleId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        trackGameShared(game, 'download_image');
        showToast('Bild gespeichert!');
      }
    } catch (err) {
      // AbortError = user cancelled the share sheet — not an error
      if ((err as DOMException)?.name !== 'AbortError') {
        showToast('Bild konnte nicht erstellt werden');
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={generating}
      className="flex items-center justify-center rounded border-2 border-[var(--color-gray-bg)] px-3 py-2.5 text-[var(--color-gray-text)] transition-all hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)] disabled:opacity-50"
      aria-label="Als Bild teilen"
      title="Als Bild teilen"
    >
      {generating ? (
        <svg
          className="h-5 w-5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      )}
    </button>
  );
}
