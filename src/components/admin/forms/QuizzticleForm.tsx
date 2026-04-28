import type { QuizzticlePuzzle, QuizzticleItem } from '@/types';
import { JsonModeToggle, ChipInput } from './JsonModeToggle';

export type QuizzticlePayload = Pick<QuizzticlePuzzle, 'episode' | 'prompt' | 'category' | 'slot_count' | 'duration_seconds' | 'items'>;

export function emptyQuizzticle(): QuizzticlePayload {
  return {
    episode: 1,
    prompt: '',
    category: '',
    slot_count: 0,
    duration_seconds: 1200,
    items: [],
  };
}

export function QuizzticleForm({ value, onChange }: { value: QuizzticlePayload; onChange: (v: QuizzticlePayload) => void }) {
  const updateItem = (i: number, patch: Partial<QuizzticleItem>) =>
    onChange({ ...value, items: value.items.map((it, j) => j === i ? { ...it, ...patch } : it) });
  const add = () => {
    const next = [...value.items, { display: '', accepted_answers: [] }];
    onChange({ ...value, items: next, slot_count: next.length });
  };
  const remove = (i: number) => {
    const next = value.items.filter((_, j) => j !== i);
    onChange({ ...value, items: next, slot_count: next.length });
  };

  return (
    <JsonModeToggle value={value} onChange={onChange}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs font-semibold">Episode
            <input type="number" value={value.episode}
              onChange={(e) => onChange({ ...value, episode: parseInt(e.target.value) || 0 })}
              className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs font-semibold">Kategorie (Badge)
            <input type="text" value={value.category ?? ''}
              onChange={(e) => onChange({ ...value, category: e.target.value })}
              className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs font-semibold sm:col-span-2">Prompt
            <input type="text" value={value.prompt}
              onChange={(e) => onChange({ ...value, prompt: e.target.value })}
              placeholder="z.B. Alle 26 Schweizer Kantone"
              className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs font-semibold">Slots
            <input type="number" value={value.slot_count} readOnly
              className="block w-full rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs font-semibold">Dauer (Sek.)
            <input type="number" value={value.duration_seconds}
              onChange={(e) => onChange({ ...value, duration_seconds: parseInt(e.target.value) || 1200 })}
              className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm uppercase text-[var(--color-gray-text)]">
            Items ({value.items.length})
          </h2>
          <button type="button" onClick={add}
            className="rounded bg-[var(--color-cyan)] px-2 py-1 text-xs font-semibold text-white cursor-pointer">
            + Item
          </button>
        </div>
        <div className="space-y-2">
          {value.items.map((it, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_2fr_auto] gap-2 items-center">
              <span className="text-xs text-[var(--color-gray-text)] w-6 text-right">{i + 1}.</span>
              <input type="text" value={it.display} onChange={(e) => updateItem(i, { display: e.target.value })}
                placeholder="Anzeige"
                className="rounded border border-gray-200 px-2 py-1.5 text-sm font-semibold" />
              <ChipInput value={it.accepted_answers} onChange={(v) => updateItem(i, { accepted_answers: v })}
                placeholder="Akzeptierte Varianten (Enter)…" />
              <button type="button" onClick={() => remove(i)}
                className="text-red-600 text-xs hover:underline cursor-pointer">×</button>
            </div>
          ))}
        </div>
      </div>
    </JsonModeToggle>
  );
}
