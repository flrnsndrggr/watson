// supabase/functions/cms-mutate/index.ts
//
// Server-side puzzle CMS mutator. Editor UIs invoke this via
// supabase.functions.invoke('cms-mutate', { body: {...} }) with
// `x-cms-secret` set to the shared CMS secret.
//
// Schema is intentionally minimal — no `status` column, no audit log.
// Visibility is purely date-based via existing RLS:
//   future publish_date  → hidden (treated as "scheduled" in the UI)
//   sentinel 9999-12-31  → hidden (treated as "draft" in the UI)
//   today / past         → live
//
// Env vars (set via `supabase secrets set`):
//   CMS_SECRET                 - shared secret
//   SUPABASE_URL               - injected by the platform
//   SUPABASE_SERVICE_ROLE_KEY  - injected by the platform

// @ts-nocheck — Deno runtime, not the project's tsconfig.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CMS_SECRET = Deno.env.get('CMS_SECRET') ?? '';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cms-secret',
};

const GAME_TYPES = [
  'verbindige', 'zaemesetzli', 'schlagloch', 'quizzhuber', 'aufgedeckt', 'quizzticle',
];

const GAME_TABLE: Record<string, string> = {
  verbindige: 'verbindige_puzzles',
  zaemesetzli: 'zaemesetzli_puzzles',
  schlagloch: 'schlagloch_puzzles',
  quizzhuber: 'quizzhuber_puzzles',
  aufgedeckt: 'aufgedeckt_puzzles',
  quizzticle: 'quizzticle_puzzles',
};

// ============================================================
// Per-game payload validators.
// ============================================================

function isStr(v: unknown): v is string { return typeof v === 'string'; }
function isNum(v: unknown): v is number { return typeof v === 'number' && Number.isFinite(v); }
function isArr(v: unknown): v is unknown[] { return Array.isArray(v); }
function isObj(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null && !Array.isArray(v); }

function validatePayload(gameType: string, payload: unknown): string[] {
  if (!isObj(payload)) return ['payload must be an object'];
  const errs: string[] = [];

  switch (gameType) {
    case 'verbindige': {
      const groups = (payload as any).groups;
      if (!isArr(groups) || groups.length !== 4) errs.push('verbindige: needs exactly 4 groups');
      else {
        const seenWords = new Set<string>();
        groups.forEach((g: any, gi: number) => {
          if (!isObj(g)) { errs.push(`group ${gi}: must be an object`); return; }
          if (!isStr(g.category) || !g.category.trim()) errs.push(`group ${gi}: category required`);
          if (![1,2,3,4].includes(g.difficulty)) errs.push(`group ${gi}: difficulty must be 1..4`);
          if (!isArr(g.items) || g.items.length !== 4) { errs.push(`group ${gi}: needs exactly 4 items`); return; }
          g.items.forEach((it: any, ii: number) => {
            if (!isObj(it) || !isStr(it.text) || !it.text.trim()) errs.push(`group ${gi} item ${ii}: text required`);
            else {
              const w = it.text.trim().toLowerCase();
              if (seenWords.has(w)) errs.push(`duplicate word: "${it.text}"`);
              seenWords.add(w);
            }
          });
        });
      }
      break;
    }
    case 'zaemesetzli': {
      const emojis = (payload as any).emojis;
      const compounds = (payload as any).valid_compounds;
      if (!isArr(emojis) || emojis.length === 0) errs.push('zaemesetzli: emojis array required');
      const emojiSet = new Set<string>();
      if (isArr(emojis)) {
        emojis.forEach((e: any, i: number) => {
          if (!isObj(e) || !isStr(e.emoji) || !e.emoji) errs.push(`emoji ${i}: emoji string required`);
          else emojiSet.add(e.emoji);
          if (!isStr(e?.canonical_noun) || !e.canonical_noun) errs.push(`emoji ${i}: canonical_noun required`);
        });
      }
      if (!isArr(compounds) || compounds.length === 0) errs.push('zaemesetzli: valid_compounds required');
      if (isArr(compounds)) {
        compounds.forEach((c: any, i: number) => {
          if (!isObj(c) || !isStr(c.word) || !c.word) errs.push(`compound ${i}: word required`);
          if (!isArr(c?.components) || c.components.length === 0) errs.push(`compound ${i}: components required`);
          else c.components.forEach((ce: any) => {
            if (!emojiSet.has(ce)) errs.push(`compound ${i}: component "${ce}" not in emojis`);
          });
          if (!isNum(c?.points)) errs.push(`compound ${i}: points must be number`);
        });
      }
      if (!isNum((payload as any).max_score)) errs.push('zaemesetzli: max_score must be number');
      const rt = (payload as any).rank_thresholds;
      if (!isObj(rt)) errs.push('zaemesetzli: rank_thresholds required');
      else {
        for (const k of ['stift','lehrling','geselle','meister','bundesrat']) {
          if (!isNum(rt[k])) errs.push(`rank_thresholds.${k} must be number`);
        }
      }
      break;
    }
    case 'schlagloch': {
      const headlines = (payload as any).headlines;
      if (!isArr(headlines) || headlines.length < 1) errs.push('schlagloch: at least 1 headline required');
      if (isArr(headlines)) {
        headlines.forEach((h: any, i: number) => {
          if (!isObj(h)) { errs.push(`headline ${i}: must be object`); return; }
          if (!isStr(h.display) || !h.display.includes('_____')) errs.push(`headline ${i}: display must contain "_____"`);
          if (!isStr(h.blanked_word) || !h.blanked_word.trim()) errs.push(`headline ${i}: blanked_word required`);
          if (!isArr(h.accepted_answers) || h.accepted_answers.length === 0) errs.push(`headline ${i}: accepted_answers required`);
          if (![1,2,3].includes(h.difficulty)) errs.push(`headline ${i}: difficulty must be 1..3`);
        });
      }
      break;
    }
    case 'quizzhuber': {
      if (!isNum((payload as any).episode)) errs.push('quizzhuber: episode required');
      if (!isStr((payload as any).intro)) errs.push('quizzhuber: intro required');
      const qs = (payload as any).questions;
      if (!isArr(qs) || qs.length !== 10) errs.push('quizzhuber: exactly 10 questions');
      if (isArr(qs)) qs.forEach((q: any, i: number) => {
        if (!isObj(q)) { errs.push(`q${i}: must be object`); return; }
        if (!isStr(q.prompt) || !q.prompt.trim()) errs.push(`q${i}: prompt required`);
        if (!isArr(q.options) || q.options.length !== 4) errs.push(`q${i}: exactly 4 options`);
        if (!isNum(q.correct_index) || q.correct_index < 0 || q.correct_index > 3) errs.push(`q${i}: correct_index must be 0..3`);
      });
      break;
    }
    case 'aufgedeckt': {
      if (!isNum((payload as any).episode)) errs.push('aufgedeckt: episode required');
      const rounds = (payload as any).rounds;
      if (!isArr(rounds) || rounds.length < 1) errs.push('aufgedeckt: at least 1 round');
      if (isArr(rounds)) rounds.forEach((r: any, i: number) => {
        if (!isObj(r)) { errs.push(`round ${i}: must be object`); return; }
        if (!isStr(r.image_url) || !r.image_url.startsWith('http')) errs.push(`round ${i}: image_url required`);
        if (!isStr(r.answer) || !r.answer.trim()) errs.push(`round ${i}: answer required`);
        if (!isArr(r.accepted_answers) || r.accepted_answers.length === 0) errs.push(`round ${i}: accepted_answers required`);
      });
      break;
    }
    case 'quizzticle': {
      if (!isNum((payload as any).episode)) errs.push('quizzticle: episode required');
      if (!isStr((payload as any).prompt)) errs.push('quizzticle: prompt required');
      if (!isNum((payload as any).slot_count)) errs.push('quizzticle: slot_count required');
      if (!isNum((payload as any).duration_seconds) || (payload as any).duration_seconds <= 0) errs.push('quizzticle: duration_seconds > 0');
      const items = (payload as any).items;
      if (!isArr(items)) errs.push('quizzticle: items required');
      else {
        if (items.length !== (payload as any).slot_count) errs.push('quizzticle: items.length must equal slot_count');
        items.forEach((it: any, i: number) => {
          if (!isObj(it) || !isStr(it.display) || !it.display.trim()) errs.push(`item ${i}: display required`);
          if (!isArr(it?.accepted_answers) || it.accepted_answers.length === 0) errs.push(`item ${i}: accepted_answers required`);
        });
      }
      break;
    }
    default:
      errs.push(`unknown game_type: ${gameType}`);
  }
  return errs;
}

// ============================================================
// Per-game row composition.
// ============================================================

function gameRow(gameType: string, payload: any): Record<string, unknown> {
  switch (gameType) {
    case 'verbindige':  return { groups: payload.groups };
    case 'zaemesetzli': return {
      emojis: payload.emojis,
      valid_compounds: payload.valid_compounds,
      max_score: payload.max_score,
      rank_thresholds: payload.rank_thresholds,
    };
    case 'schlagloch': return { headlines: payload.headlines };
    case 'quizzhuber': return {
      episode: payload.episode,
      intro: payload.intro,
      questions: payload.questions,
    };
    case 'aufgedeckt': return {
      episode: payload.episode,
      threshold: payload.threshold ?? 20,
      rounds: payload.rounds,
    };
    case 'quizzticle': return {
      episode: payload.episode,
      prompt: payload.prompt,
      slot_count: payload.slot_count,
      duration_seconds: payload.duration_seconds ?? 1200,
      items: payload.items,
      category: payload.category ?? null,
    };
    default: throw new Error(`unknown game_type: ${gameType}`);
  }
}

async function fetchFullPuzzle(id: string): Promise<{ puzzle: any; game: any } | null> {
  const { data: puzzle } = await admin.from('puzzles').select('*').eq('id', id).maybeSingle();
  if (!puzzle) return null;
  const table = GAME_TABLE[puzzle.game_type];
  if (!table) return { puzzle, game: null };
  const { data: game } = await admin.from(table).select('*').eq('id', id).maybeSingle();
  return { puzzle, game };
}

// ============================================================
// Action handlers.
// ============================================================

async function actionListPuzzles(body: any) {
  const { game_type, from, to } = body;
  if (!GAME_TYPES.includes(game_type)) return { status: 400, body: { error: 'invalid game_type' } };
  let q = admin.from('puzzles').select('*').eq('game_type', game_type).order('publish_date', { ascending: false });
  if (from) q = q.gte('publish_date', from);
  if (to) q = q.lte('publish_date', to);
  const { data, error } = await q;
  if (error) return { status: 500, body: { error: error.message } };
  return { status: 200, body: { puzzles: data } };
}

async function actionListAllSchedule(body: any) {
  const { from, to } = body;
  let q = admin.from('puzzles').select('*').order('publish_date', { ascending: true });
  if (from) q = q.gte('publish_date', from);
  if (to) q = q.lte('publish_date', to);
  const { data, error } = await q;
  if (error) return { status: 500, body: { error: error.message } };
  return { status: 200, body: { puzzles: data } };
}

async function actionFetchPuzzle(body: any) {
  const { id } = body;
  if (!isStr(id)) return { status: 400, body: { error: 'id required' } };
  const full = await fetchFullPuzzle(id);
  if (!full || !full.puzzle) return { status: 404, body: { error: 'not found' } };
  return { status: 200, body: full };
}

async function actionCreatePuzzle(body: any) {
  const { game_type, publish_date, payload } = body;
  if (!GAME_TYPES.includes(game_type)) return { status: 400, body: { error: 'invalid game_type' } };
  if (!isStr(publish_date) || !/^\d{4}-\d{2}-\d{2}$/.test(publish_date)) {
    return { status: 400, body: { error: 'publish_date must be YYYY-MM-DD' } };
  }

  const errs = validatePayload(game_type, payload);
  if (errs.length) return { status: 400, body: { error: 'validation', details: errs } };

  const id = crypto.randomUUID();
  const { error: pErr } = await admin.from('puzzles').insert({ id, game_type, publish_date });
  if (pErr) return { status: 500, body: { error: pErr.message } };

  const row = { id, ...gameRow(game_type, payload) };
  const { error: gErr } = await admin.from(GAME_TABLE[game_type]).insert(row);
  if (gErr) {
    // Rollback the parent row to avoid orphans.
    await admin.from('puzzles').delete().eq('id', id);
    return { status: 500, body: { error: gErr.message } };
  }

  return { status: 200, body: { id } };
}

async function actionUpdatePuzzle(body: any) {
  const { id, publish_date, payload } = body;
  if (!isStr(id)) return { status: 400, body: { error: 'id required' } };
  if (publish_date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(publish_date)) {
    return { status: 400, body: { error: 'publish_date must be YYYY-MM-DD' } };
  }

  const before = await fetchFullPuzzle(id);
  if (!before?.puzzle) return { status: 404, body: { error: 'not found' } };
  const gameType = before.puzzle.game_type;

  if (payload !== undefined) {
    const errs = validatePayload(gameType, payload);
    if (errs.length) return { status: 400, body: { error: 'validation', details: errs } };
  }

  if (publish_date !== undefined) {
    const { error } = await admin.from('puzzles').update({ publish_date }).eq('id', id);
    if (error) return { status: 500, body: { error: error.message } };
  }
  if (payload !== undefined) {
    const row = gameRow(gameType, payload);
    const { error } = await admin.from(GAME_TABLE[gameType]).update(row).eq('id', id);
    if (error) return { status: 500, body: { error: error.message } };
  }

  return { status: 200, body: { ok: true } };
}

async function actionDeletePuzzle(body: any) {
  const { id } = body;
  if (!isStr(id)) return { status: 400, body: { error: 'id required' } };
  const before = await fetchFullPuzzle(id);
  if (!before?.puzzle) return { status: 404, body: { error: 'not found' } };
  // Per-game table first (no cascade FK in the minimal schema), then parent.
  await admin.from(GAME_TABLE[before.puzzle.game_type]).delete().eq('id', id);
  const { error } = await admin.from('puzzles').delete().eq('id', id);
  if (error) return { status: 500, body: { error: error.message } };
  return { status: 200, body: { ok: true } };
}

async function actionSwapDates(body: any) {
  const { id_a, id_b } = body;
  if (!isStr(id_a) || !isStr(id_b)) return { status: 400, body: { error: 'id_a and id_b required' } };
  const a = await fetchFullPuzzle(id_a);
  const b = await fetchFullPuzzle(id_b);
  if (!a?.puzzle || !b?.puzzle) return { status: 404, body: { error: 'not found' } };
  const dateA = a.puzzle.publish_date;
  const dateB = b.puzzle.publish_date;
  await admin.from('puzzles').update({ publish_date: '1900-01-01' }).eq('id', id_a);
  await admin.from('puzzles').update({ publish_date: dateA }).eq('id', id_b);
  await admin.from('puzzles').update({ publish_date: dateB }).eq('id', id_a);
  return { status: 200, body: { ok: true } };
}

const HANDLERS: Record<string, (body: any) => Promise<{ status: number; body: any }>> = {
  list_puzzles: actionListPuzzles,
  list_all_schedule: actionListAllSchedule,
  fetch_puzzle: actionFetchPuzzle,
  create_puzzle: actionCreatePuzzle,
  update_puzzle: actionUpdatePuzzle,
  delete_puzzle: actionDeletePuzzle,
  swap_puzzle_dates: actionSwapDates,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const secret = req.headers.get('x-cms-secret') ?? '';
  if (!CMS_SECRET || secret !== CMS_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }); }

  const handler = HANDLERS[body?.action as string];
  if (!handler) {
    return new Response(JSON.stringify({ error: `unknown action: ${body?.action}` }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { status, body: respBody } = await handler(body);
    return new Response(JSON.stringify(respBody), {
      status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
