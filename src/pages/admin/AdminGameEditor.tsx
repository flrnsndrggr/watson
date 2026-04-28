import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import type { GameType } from '@/types';
import {
  ALL_GAME_TYPES, GAME_LABELS, DRAFT_DATE,
  createPuzzle, updatePuzzle, deletePuzzle, fetchPuzzleAdmin, deriveStatus,
} from '@/lib/cmsApi';
import { VerbindigeForm, emptyVerbindige, type VerbindigePayload } from '@/components/admin/forms/VerbindigeForm';
import { ZaemesetzliForm, emptyZaemesetzli, type ZaemesetzliPayload } from '@/components/admin/forms/ZaemesetzliForm';
import { SchlaglochForm, emptySchlagloch, type SchlaglochPayload } from '@/components/admin/forms/SchlaglochForm';
import { QuizzhuberForm, emptyQuizzhuber, type QuizzhuberPayload } from '@/components/admin/forms/QuizzhuberForm';
import { AufgedecktForm, emptyAufgedeckt, type AufgedecktPayload } from '@/components/admin/forms/AufgedecktForm';
import { QuizzticleForm, emptyQuizzticle, type QuizzticlePayload } from '@/components/admin/forms/QuizzticleForm';
import { SAMPLE_VERBINDIGE } from '@/games/verbindige/verbindige.data';
import { SAMPLE_ZAEMESETZLI } from '@/games/zaemesetzli/zaemesetzli.data';
import { SAMPLE_SCHLAGLOCH } from '@/games/schlagloch/schlagloch.data';
import { SAMPLE_QUIZZHUBER } from '@/games/quizzhuber/quizzhuber.data';
import { SAMPLE_AUFGEDECKT } from '@/games/aufgedeckt/aufgedeckt.data';
import { SAMPLE_QUIZZTICLE } from '@/games/quizzticle/quizzticle.data';

type AnyPayload =
  | VerbindigePayload | ZaemesetzliPayload | SchlaglochPayload
  | QuizzhuberPayload | AufgedecktPayload | QuizzticlePayload;

function emptyForGame(gameType: GameType): AnyPayload {
  switch (gameType) {
    case 'verbindige':  return emptyVerbindige();
    case 'zaemesetzli': return emptyZaemesetzli();
    case 'schlagloch':  return emptySchlagloch();
    case 'quizzhuber':  return emptyQuizzhuber();
    case 'aufgedeckt':  return emptyAufgedeckt();
    case 'quizzticle':  return emptyQuizzticle();
  }
}

function sampleForGame(gameType: GameType): AnyPayload {
  switch (gameType) {
    case 'verbindige':  return { groups: SAMPLE_VERBINDIGE.groups };
    case 'zaemesetzli': return {
      emojis: SAMPLE_ZAEMESETZLI.emojis,
      valid_compounds: SAMPLE_ZAEMESETZLI.valid_compounds,
      max_score: SAMPLE_ZAEMESETZLI.max_score,
      rank_thresholds: SAMPLE_ZAEMESETZLI.rank_thresholds,
    };
    case 'schlagloch': return {
      headlines: SAMPLE_SCHLAGLOCH.headlines.map(h => ({
        ...h,
        blanked_word: '',
        accepted_answers: [],
      })) as any,
    };
    case 'quizzhuber':  return {
      episode: SAMPLE_QUIZZHUBER.episode,
      intro: SAMPLE_QUIZZHUBER.intro,
      questions: SAMPLE_QUIZZHUBER.questions,
    };
    case 'aufgedeckt':  return {
      episode: SAMPLE_AUFGEDECKT.episode,
      threshold: SAMPLE_AUFGEDECKT.threshold,
      rounds: SAMPLE_AUFGEDECKT.rounds,
    };
    case 'quizzticle':  return {
      episode: SAMPLE_QUIZZTICLE.episode,
      prompt: SAMPLE_QUIZZTICLE.prompt,
      category: SAMPLE_QUIZZTICLE.category,
      slot_count: SAMPLE_QUIZZTICLE.slot_count,
      duration_seconds: SAMPLE_QUIZZTICLE.duration_seconds,
      items: SAMPLE_QUIZZTICLE.items,
    };
  }
}

function FormFor({ gameType, value, onChange }: { gameType: GameType; value: AnyPayload; onChange: (v: AnyPayload) => void }) {
  switch (gameType) {
    case 'verbindige':  return <VerbindigeForm  value={value as VerbindigePayload}  onChange={onChange as any} />;
    case 'zaemesetzli': return <ZaemesetzliForm value={value as ZaemesetzliPayload} onChange={onChange as any} />;
    case 'schlagloch':  return <SchlaglochForm  value={value as SchlaglochPayload}  onChange={onChange as any} />;
    case 'quizzhuber':  return <QuizzhuberForm  value={value as QuizzhuberPayload}  onChange={onChange as any} />;
    case 'aufgedeckt':  return <AufgedecktForm  value={value as AufgedecktPayload}  onChange={onChange as any} />;
    case 'quizzticle':  return <QuizzticleForm  value={value as QuizzticlePayload}  onChange={onChange as any} />;
  }
}

export function AdminGameEditor() {
  const { game, id } = useParams<{ game: string; id?: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const gameType = useMemo<GameType | null>(() => {
    return ALL_GAME_TYPES.includes(game as GameType) ? (game as GameType) : null;
  }, [game]);

  const initialDate = search.get('date') ?? DRAFT_DATE;
  const [publishDate, setPublishDate] = useState<string>(initialDate);
  const [payload, setPayload] = useState<AnyPayload>(() => gameType ? emptyForGame(gameType) : ({} as AnyPayload));
  const [loading, setLoading] = useState<boolean>(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !id) return;
    let cancelled = false;
    fetchPuzzleAdmin(id).then((full) => {
      if (cancelled || !full) return;
      setPublishDate(full.puzzle.publish_date);
      // The per-game row carries the payload fields; merge them.
      const { id: _id, ...rest } = full.game ?? {};
      setPayload(rest as AnyPayload);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, isNew]);

  const handleSave = useCallback(async () => {
    if (!gameType) return;
    setSaving(true);
    setErrors([]);
    setInfo(null);
    if (isNew) {
      const res = await createPuzzle({ game_type: gameType, publish_date: publishDate, payload: payload as any });
      setSaving(false);
      if (res.ok) {
        setInfo('Erstellt.');
        navigate(`/admin/${gameType}/${res.data.id}`, { replace: true });
      } else {
        setErrors([res.error, ...(res.details ?? [])]);
      }
    } else if (id) {
      const res = await updatePuzzle({ id, publish_date: publishDate, payload: payload as any });
      setSaving(false);
      if (res.ok) setInfo('Gespeichert.');
      else setErrors([res.error, ...(res.details ?? [])]);
    }
  }, [gameType, isNew, id, publishDate, payload, navigate]);

  const handleSaveAsDraft = useCallback(async () => {
    setPublishDate(DRAFT_DATE);
    // Defer save to next tick so the publishDate state is fresh.
    setTimeout(() => { void handleSave(); }, 0);
  }, [handleSave]);

  const handleDelete = useCallback(async () => {
    if (!id || isNew) return;
    if (!confirm('Wirklich löschen?')) return;
    const res = await deletePuzzle(id);
    if (res.ok) navigate(`/admin/${gameType}`);
    else setErrors([res.error]);
  }, [id, isNew, gameType, navigate]);

  const handleLoadSample = useCallback(() => {
    if (!gameType) return;
    setPayload(sampleForGame(gameType));
  }, [gameType]);

  if (!gameType) return <div className="rounded bg-red-50 border border-red-200 p-4 text-sm">Unknown game: {game}</div>;
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-cyan)] border-t-transparent" />
      </div>
    );
  }

  const status = deriveStatus(publishDate);
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    scheduled: 'bg-yellow-100 text-yellow-700',
    published: 'bg-green-100 text-green-700',
  };
  const statusLabel: Record<string, string> = {
    draft: 'Entwurf',
    scheduled: 'Geplant',
    published: 'Live',
  };

  return (
    <div>
      <div className="mb-4">
        <Link to={`/admin/${gameType}`} className="text-xs text-[var(--color-blue)] hover:underline">
          ← {GAME_LABELS[gameType]} Liste
        </Link>
      </div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {GAME_LABELS[gameType]} {isNew ? 'erstellen' : 'bearbeiten'}
          </h1>
          <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusColors[status]}`}>
            {statusLabel[status]}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {isNew && (
            <button type="button" onClick={handleLoadSample}
              className="rounded border border-gray-200 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50 cursor-pointer">
              Beispiel laden
            </button>
          )}
          {!isNew && (
            <button type="button" onClick={handleDelete}
              className="rounded border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer">
              Löschen
            </button>
          )}
          <button type="button" onClick={handleSaveAsDraft} disabled={saving}
            className="rounded border border-gray-200 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-50">
            Als Entwurf
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="rounded bg-[var(--color-cyan)] px-4 py-1.5 text-sm font-semibold text-white hover:opacity-85 cursor-pointer disabled:opacity-50">
            {saving ? 'Speichert…' : 'Speichern'}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-3 rounded bg-red-50 border border-red-200 p-3">
          <ul className="list-disc pl-4 text-sm text-red-700 space-y-0.5">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      {info && (
        <div className="mb-3 rounded bg-green-50 border border-green-200 p-2 text-sm text-green-700">
          {info}
        </div>
      )}

      <div className="mb-4 rounded-lg bg-white border border-gray-100 p-3">
        <label className="block text-xs font-semibold text-[var(--color-gray-text)] mb-1">
          Veröffentlichungsdatum (zukünftig = versteckt; {DRAFT_DATE} = Entwurf)
        </label>
        <input type="date" value={publishDate === DRAFT_DATE ? '' : publishDate}
          onChange={(e) => setPublishDate(e.target.value || DRAFT_DATE)}
          className="rounded border border-gray-200 px-2 py-1.5 text-sm" />
        <button type="button" onClick={() => setPublishDate(DRAFT_DATE)}
          className="ml-2 text-xs text-[var(--color-gray-text)] hover:underline">
          → Entwurf
        </button>
      </div>

      <FormFor gameType={gameType} value={payload} onChange={setPayload} />
    </div>
  );
}
