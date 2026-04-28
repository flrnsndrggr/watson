// Client wrappers around the cms-mutate Edge Function.
//
// All editor reads (drafts + scheduled) and writes go through this module.
// The player-facing supabase.ts continues to use the anon key for published
// content only (filtered by date-based RLS).
//
// CMS_SECRET sourcing — reads `VITE_CMS_SECRET` from the build env. The
// secret matches the Edge Function's `CMS_SECRET` env var; rotate both
// together. Anyone with the production password can rebuild and ship a
// matching secret, so this is no weaker than the existing shared-admin
// gate at /admin.

import type { GameType } from '@/types';

const CMS_SECRET: string = (import.meta.env.VITE_CMS_SECRET as string | undefined) ?? '';
const SUPABASE_URL: string = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const SUPABASE_ANON_KEY: string = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';
const FUNCTION_URL = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/cms-mutate`;

// Sentinel used by the UI to keep an authored puzzle hidden until an editor
// picks a real publish date. Far enough in the future that the date-based
// RLS rule keeps it invisible to anonymous readers.
export const DRAFT_DATE = '9999-12-31';

export type PuzzleStatus = 'draft' | 'scheduled' | 'published';

/** Derived status from publish_date alone (schema has no `status` column). */
export function deriveStatus(publishDate: string, today = new Date().toISOString().slice(0, 10)): PuzzleStatus {
  if (publishDate === DRAFT_DATE) return 'draft';
  if (publishDate > today) return 'scheduled';
  return 'published';
}

type CmsResponse<T> = { ok: true; data: T } | { ok: false; status: number; error: string; details?: string[] };

async function call<T>(action: string, body: object = {}): Promise<CmsResponse<T>> {
  // Direct fetch instead of supabase.functions.invoke — the bundled SDK's
  // functions client is missing .invoke in this build. Same wire format.
  let res: Response;
  try {
    res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-cms-secret': CMS_SECRET,
        // The function is deployed with verify_jwt=false, but Supabase's
        // edge gateway still requires the apikey header to route the call.
        'apikey': SUPABASE_ANON_KEY,
        'authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action, ...body }),
    });
  } catch (err: any) {
    return { ok: false, status: 0, error: err?.message ?? 'network error' };
  }

  let json: any = null;
  try { json = await res.json(); } catch { /* response not JSON */ }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: json?.error ?? `HTTP ${res.status}`,
      details: json?.details,
    };
  }

  return { ok: true, data: json as T };
}

// ============================================================
// Read APIs.
// ============================================================

export interface PuzzleRow {
  id: string;
  game_type: GameType;
  publish_date: string;
}

export async function listPuzzlesAdmin(
  gameType: GameType,
  opts: { from?: string; to?: string } = {},
): Promise<PuzzleRow[]> {
  const res = await call<{ puzzles: PuzzleRow[] }>('list_puzzles', { game_type: gameType, ...opts });
  return res.ok ? res.data.puzzles : [];
}

export async function listAllSchedule(
  opts: { from?: string; to?: string } = {},
): Promise<PuzzleRow[]> {
  const res = await call<{ puzzles: PuzzleRow[] }>('list_all_schedule', opts);
  return res.ok ? res.data.puzzles : [];
}

export async function fetchPuzzleAdmin(id: string): Promise<{ puzzle: PuzzleRow; game: any } | null> {
  const res = await call<{ puzzle: PuzzleRow; game: any }>('fetch_puzzle', { id });
  return res.ok ? res.data : null;
}

// ============================================================
// Write APIs.
// ============================================================

export interface CreatePuzzleInput {
  game_type: GameType;
  publish_date: string;
  payload: Record<string, unknown>;
}

export async function createPuzzle(input: CreatePuzzleInput) {
  return call<{ id: string }>('create_puzzle', input);
}

export interface UpdatePuzzleInput {
  id: string;
  publish_date?: string;
  payload?: Record<string, unknown>;
}

export async function updatePuzzle(input: UpdatePuzzleInput) {
  return call<{ ok: true }>('update_puzzle', input);
}

export async function deletePuzzle(id: string) {
  return call<{ ok: true }>('delete_puzzle', { id });
}

export async function swapPuzzleDates(idA: string, idB: string) {
  return call<{ ok: true }>('swap_puzzle_dates', { id_a: idA, id_b: idB });
}

export const ALL_GAME_TYPES: GameType[] = [
  'verbindige', 'zaemesetzli', 'schlagloch', 'quizzhuber', 'aufgedeckt', 'quizzticle',
];

export const GAME_LABELS: Record<GameType, string> = {
  verbindige: 'Verbindige',
  zaemesetzli: 'Zaemesetzli',
  schlagloch: 'Schlagloch',
  quizzhuber: 'Quizz den Huber',
  aufgedeckt: 'Aufgedeckt',
  quizzticle: 'Quizzticle',
};

export const GAME_COLORS: Record<GameType, string> = {
  verbindige: 'var(--color-difficulty-1)',
  zaemesetzli: 'var(--color-green)',
  schlagloch: 'var(--color-blue)',
  quizzhuber: '#8b5cf6',
  aufgedeckt: '#f59e0b',
  quizzticle: '#ec4899',
};
