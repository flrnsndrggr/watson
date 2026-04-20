const GAME_LABELS: Record<string, string> = {
  verbindige: 'Verbindige',
  zaemesetzli: 'Zämesetzli',
  schlagziil: 'Schlagziil',
};

const GAME_EMOJIS: Record<string, string> = {
  verbindige: '🇨🇭',
  zaemesetzli: '🧩',
  schlagziil: '📰',
};

export function generateShareText(
  game: string,
  puzzleNumber: number | string,
  resultLines: string,
): string {
  const label = GAME_LABELS[game] ?? game;
  const emoji = GAME_EMOJIS[game] ?? '';
  return `${label} #${puzzleNumber} ${emoji}\n${resultLines}\ngames-watson.netlify.app/${game}`;
}

/** Returns 'shared' if Web Share API was used, 'copied' if clipboard fallback. */
export async function share(text: string): Promise<'shared' | 'copied'> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch {
      // User cancelled or not supported — fall through to clipboard
    }
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
