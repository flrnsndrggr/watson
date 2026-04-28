import type { AufgedecktPuzzle, AufgedecktRound } from '@/types';
import { JsonModeToggle, ChipInput } from './JsonModeToggle';

export type AufgedecktPayload = Pick<AufgedecktPuzzle, 'episode' | 'threshold' | 'rounds'>;

export function emptyAufgedeckt(): AufgedecktPayload {
  return {
    episode: 1,
    threshold: 80,
    rounds: Array.from({ length: 10 }, (): AufgedecktRound => ({
      image_url: '',
      answer: '',
      accepted_answers: [],
      hint: '',
    })),
  };
}

export function AufgedecktForm({ value, onChange }: { value: AufgedecktPayload; onChange: (v: AufgedecktPayload) => void }) {
  const updateR = (i: number, patch: Partial<AufgedecktRound>) =>
    onChange({ ...value, rounds: value.rounds.map((r, j) => j === i ? { ...r, ...patch } : r) });

  return (
    <JsonModeToggle value={value} onChange={onChange}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <label className="text-xs font-semibold">Episode
            <input type="number" value={value.episode}
              onChange={(e) => onChange({ ...value, episode: parseInt(e.target.value) || 0 })}
              className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs font-semibold">Threshold
            <input type="number" value={value.threshold}
              onChange={(e) => onChange({ ...value, threshold: parseInt(e.target.value) || 0 })}
              className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
          </label>
        </div>

        <h2 className="font-bold text-sm uppercase text-[var(--color-gray-text)]">10 Bilder</h2>
        {value.rounds.map((r, i) => (
          <div key={i} className="rounded border border-gray-200 bg-white p-3 space-y-2">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold shrink-0">#{i + 1}</span>
              {r.image_url && (
                <img src={r.image_url} alt="" className="h-12 w-12 rounded object-cover bg-gray-100" />
              )}
              <input type="url" value={r.image_url} onChange={(e) => updateR(i, { image_url: e.target.value })}
                placeholder="https://… (externe URLs können brechen)"
                className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-xs font-mono" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input type="text" value={r.answer} onChange={(e) => updateR(i, { answer: e.target.value })}
                placeholder="Antwort"
                className="rounded border border-gray-200 px-2 py-1.5 text-sm font-semibold" />
              <ChipInput value={r.accepted_answers} onChange={(v) => updateR(i, { accepted_answers: v })}
                placeholder="Akzeptierte Varianten…" />
            </div>
            <div className="grid grid-cols-[auto_auto_1fr] gap-2 items-center">
              <label className="text-xs">Cols
                <input type="number" value={r.cols ?? 5}
                  onChange={(e) => updateR(i, { cols: parseInt(e.target.value) || 5 })}
                  className="ml-1 w-14 rounded border border-gray-200 px-1.5 py-1 text-xs" />
              </label>
              <label className="text-xs">Rows
                <input type="number" value={r.rows ?? 5}
                  onChange={(e) => updateR(i, { rows: parseInt(e.target.value) || 5 })}
                  className="ml-1 w-14 rounded border border-gray-200 px-1.5 py-1 text-xs" />
              </label>
              <input type="text" value={r.hint ?? ''} onChange={(e) => updateR(i, { hint: e.target.value })}
                placeholder="Hinweis (optional)"
                className="rounded border border-gray-200 px-2 py-1.5 text-xs" />
            </div>
          </div>
        ))}
        <p className="text-xs text-[var(--color-gray-text)]">
          ⚠️ Externe Bild-URLs können verschwinden. Wikimedia ist relativ stabil; Hotlinks von News-Sites brechen oft.
        </p>
      </div>
    </JsonModeToggle>
  );
}
