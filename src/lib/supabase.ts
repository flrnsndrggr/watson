import { createClient } from '@supabase/supabase-js';
import type { GameType } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Returns today's date in YYYY-MM-DD format (Europe/Zurich timezone). */
export function getTodayDateCET(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
}

// ----- Game-specific table names and column selects -----

const GAME_TABLE: Record<GameType, string> = {
  verbindige: 'verbindige_puzzles',
  zaemesetzli: 'zaemesetzli_puzzles',
  schlagziil: 'schlagziil_puzzles',
};

const GAME_SELECT: Record<GameType, string> = {
  verbindige: '*',
  zaemesetzli: '*',
  schlagziil: '*',
};

interface PuzzleRow {
  id: string;
  game_type: GameType;
  publish_date: string;
}

/**
 * Fetch all published puzzle dates (past only, excluding today).
 * Returns an array of { publish_date, game_type } rows.
 */
export async function fetchPuzzleDates(): Promise<{ publish_date: string; game_type: GameType }[]> {
  try {
    const today = getTodayDateCET();
    const { data, error } = await supabase
      .from('puzzles')
      .select('publish_date, game_type')
      .lt('publish_date', today)
      .order('publish_date', { ascending: false });

    if (error || !data) return [];
    return data as { publish_date: string; game_type: GameType }[];
  } catch {
    return [];
  }
}

/**
 * Fetch a specific puzzle by game type and date.
 * Returns null if not found.
 */
export async function fetchPuzzleByDate<T>(gameType: GameType, date: string): Promise<T | null> {
  try {
    const table = GAME_TABLE[gameType];
    const select = GAME_SELECT[gameType];

    const { data: puzzleRow, error: puzzleError } = await supabase
      .from('puzzles')
      .select('id, game_type, publish_date')
      .eq('game_type', gameType)
      .eq('publish_date', date)
      .maybeSingle();

    if (puzzleError || !puzzleRow) return null;

    const row = puzzleRow as PuzzleRow;

    const { data: gameData, error: gameError } = await supabase
      .from(table)
      .select(select)
      .eq('puzzle_id', row.id)
      .maybeSingle();

    if (gameError || !gameData) return null;

    const gameObj = gameData as unknown as Record<string, unknown>;
    return { ...gameObj, id: row.id, date: row.publish_date } as T;
  } catch {
    return null;
  }
}

/**
 * Fetch today's puzzle for a given game type from Supabase.
 * Returns null if no puzzle is published or Supabase is unreachable.
 */
export async function fetchTodaysPuzzle<T>(gameType: GameType): Promise<T | null> {
  try {
    const today = getTodayDateCET();
    const table = GAME_TABLE[gameType];
    const select = GAME_SELECT[gameType];

    // First, find today's puzzle ID from the parent table
    const { data: puzzleRow, error: puzzleError } = await supabase
      .from('puzzles')
      .select('id, game_type, publish_date')
      .eq('game_type', gameType)
      .eq('publish_date', today)
      .maybeSingle();

    if (puzzleError || !puzzleRow) return null;

    const row = puzzleRow as PuzzleRow;

    // Then fetch the game-specific data
    const { data: gameData, error: gameError } = await supabase
      .from(table)
      .select(select)
      .eq('puzzle_id', row.id)
      .maybeSingle();

    if (gameError || !gameData) return null;

    // Merge parent puzzle fields with game-specific data
    const gameObj = gameData as unknown as Record<string, unknown>;
    return { ...gameObj, id: row.id, date: row.publish_date } as T;
  } catch {
    return null;
  }
}
