import type { GameType } from '@/types';

function storageKey(gameType: GameType, date: string): string {
  return `watson_${gameType}_${date}`;
}

export function saveGameState<T>(gameType: GameType, date: string, state: T): void {
  try {
    localStorage.setItem(storageKey(gameType, date), JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function loadGameState<T>(gameType: GameType, date: string): T | null {
  try {
    const raw = localStorage.getItem(storageKey(gameType, date));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
