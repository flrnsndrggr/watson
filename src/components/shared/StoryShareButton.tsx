import { useState } from 'react';
import { generateStoryCard, type ShareCardData } from '@/lib/shareImage';
import { showToast } from '@/components/shared/Toast';
import { trackGameShared } from '@/lib/analytics';
import type { GameType } from '@/types';

interface StoryShareButtonProps {
  cardData: ShareCardData;
  game: GameType;
}

export function StoryShareButton({ cardData, game }: StoryShareButtonProps) {
  const [generating, setGenerating] = useState(false);

  async function handleClick() {
    if (generating) return;
    setGenerating(true);

    try {
      const blob = await generateStoryCard(cardData);
      const file = new File([blob], `${game}-${cardData.puzzleId}-story.png`, {
        type: 'image/png',
      });

      // Prefer Web Share API with file support (mobile)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${cardData.gameName} #${cardData.puzzleId}`,
        });
        trackGameShared(game, 'share_story');
      } else {
        // Desktop fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${game}-${cardData.puzzleId}-story.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        trackGameShared(game, 'download_story');
        showToast('Story-Bild gespeichert!');
      }
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') {
        showToast('Story-Bild konnte nicht erstellt werden');
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={generating}
      className="flex items-center justify-center rounded border-2 border-[var(--color-gray-bg)] px-3 py-2.5 text-[var(--color-gray-text)] transition-all hover:border-[var(--color-pink)] hover:text-[var(--color-pink)] disabled:opacity-50"
      aria-label="Für Instagram Story teilen"
      title="Für Instagram Story teilen"
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
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="3" />
        </svg>
      )}
    </button>
  );
}
