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
  puzzleNumber: number,
  resultLines: string,
): string {
  const label = GAME_LABELS[game] ?? game;
  const emoji = GAME_EMOJIS[game] ?? '';
  return `${label} #${puzzleNumber} ${emoji}\n${resultLines}\nwatson.ch/spiele/${game}`;
}

export async function share(text: string): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch {
      // User cancelled or not supported — fall through to clipboard
    }
  }
  await navigator.clipboard.writeText(text);
}
