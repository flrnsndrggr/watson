const GAME_LABELS: Record<string, string> = {
  verbindige: 'Verbindige',
  zaemesetzli: 'Zämesetzli',
  schlagloch: 'Schlagloch',
  schlagloch_rueckblick: 'Schlagloch Rückblick',
};

const GAME_EMOJIS: Record<string, string> = {
  verbindige: '🇨🇭',
  zaemesetzli: '🧩',
  schlagloch: '📰',
  schlagloch_rueckblick: '📰',
};

const GAME_PATHS: Record<string, string> = {
  schlagloch_rueckblick: 'schlagloch',
};

export function generateShareText(
  game: string,
  puzzleNumber: number | string,
  resultLines: string,
): string {
  const label = GAME_LABELS[game] ?? game;
  const emoji = GAME_EMOJIS[game] ?? '';
  const path = GAME_PATHS[game] ?? game;
  return `${label} #${puzzleNumber} ${emoji}\n${resultLines}\ngames-watson.netlify.app/${path}`;
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
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'copied'; // Best-effort — some browsers silently succeed despite error
  }
}
