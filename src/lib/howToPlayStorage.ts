const STORAGE_PREFIX = 'watson_htp_seen_';

export function hasSeenHowToPlay(gameId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${gameId}`) === '1';
  } catch {
    return false;
  }
}

export function markHowToPlaySeen(gameId: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${gameId}`, '1');
  } catch {
    // localStorage unavailable — no-op
  }
}
