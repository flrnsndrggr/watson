import { createClient } from '@supabase/supabase-js';
import type { GameType, VerbindigeEdition } from '@/types';
import { getTodayDateCET } from '@/lib/dateUtils';

// Re-export so existing consumers that import from supabase.ts keep working
export { getTodayDateCET };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ----- Game-specific table names and column selects -----

const GAME_TABLE: Record<GameType, string> = {
  verbindige: 'verbindige_puzzles',
  zaemesetzli: 'zaemesetzli_puzzles',
  schlagloch: 'schlagloch_puzzles',
  quizzhuber: 'quizzhuber_puzzles',
  aufgedeckt: 'aufgedeckt_puzzles',
  quizzticle: 'quizzticle_puzzles',
};

const GAME_SELECT: Record<GameType, string> = {
  verbindige: '*',
  zaemesetzli: '*',
  schlagloch: '*',
  quizzhuber: '*',
  aufgedeckt: '*',
  quizzticle: '*',
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
      .eq('id', row.id)
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
      .eq('id', row.id)
      .maybeSingle();

    if (gameError || !gameData) return null;

    // Merge parent puzzle fields with game-specific data
    const gameObj = gameData as unknown as Record<string, unknown>;
    return { ...gameObj, id: row.id, date: row.publish_date } as T;
  } catch {
    return null;
  }
}

// ----- Branded Verbindige Editions -----

/** Fetch a published branded edition by slug. */
export async function fetchEditionBySlug(slug: string): Promise<VerbindigeEdition | null> {
  try {
    const { data, error } = await supabase
      .from('verbindige_editions')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !data) return null;
    return data as VerbindigeEdition;
  } catch {
    return null;
  }
}

/** Fetch all branded editions (admin — includes drafts). */
export async function fetchAllEditions(): Promise<VerbindigeEdition[]> {
  try {
    const { data, error } = await supabase
      .from('verbindige_editions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as VerbindigeEdition[];
  } catch {
    return [];
  }
}

/** Create or update a branded edition. */
export async function upsertEdition(
  edition: Omit<VerbindigeEdition, 'created_at' | 'updated_at'>,
): Promise<VerbindigeEdition | null> {
  try {
    const { data, error } = await supabase
      .from('verbindige_editions')
      .upsert({ ...edition, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error || !data) return null;
    return data as VerbindigeEdition;
  } catch {
    return null;
  }
}

/** Delete a branded edition by ID. */
export async function deleteEdition(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('verbindige_editions')
      .delete()
      .eq('id', id);

    return !error;
  } catch {
    return false;
  }
}
