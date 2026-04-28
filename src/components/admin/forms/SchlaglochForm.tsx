import type { SchlaglochHeadline } from '@/types';
import { JsonModeToggle, ChipInput } from './JsonModeToggle';

// Authoring shape — extends the base type with the per-headline answer
// fields that the runtime tolerates as optional but the editor requires.
export interface SchlaglochHeadlineEditable extends SchlaglochHeadline {
  blanked_word: string;
  accepted_answers: string[];
}

export type SchlaglochPayload = { headlines: SchlaglochHeadlineEditable[] };

export function emptySchlagloch(): SchlaglochPayload {
  return {
    headlines: [{
      display: '_____',
      blanked_word: '',
      accepted_answers: [],
      article_url: '',
      article_year: new Date().getFullYear(),
      article_date: '',
      category: 'Schweiz',
      difficulty: 1,
      context_hint: '',
    }],
  };
}

export function SchlaglochForm({ value, onChange }: { value: SchlaglochPayload; onChange: (v: SchlaglochPayload) => void }) {
  const update = (i: number, patch: Partial<SchlaglochHeadlineEditable>) =>
    onChange({ headlines: value.headlines.map((h, j) => j === i ? { ...h, ...patch } : h) });
  const add = () => onChange({
    ...value,
    headlines: [...value.headlines, { ...emptySchlagloch().headlines[0] }],
  });
  const remove = (i: number) =>
    onChange({ headlines: value.headlines.filter((_, j) => j !== i) });

  return (
    <JsonModeToggle value={value} onChange={onChange}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm uppercase text-[var(--color-gray-text)]">
            Schlagzeilen ({value.headlines.length})
          </h2>
          <button type="button" onClick={add}
            className="rounded bg-[var(--color-cyan)] px-2 py-1 text-xs font-semibold text-white cursor-pointer">
            + Hinzufügen
          </button>
        </div>
        {value.headlines.map((h, i) => (
          <div key={i} className="rounded border border-gray-200 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-gray-text)]">#{i + 1}</span>
              <button type="button" onClick={() => remove(i)}
                className="text-red-600 text-xs hover:underline cursor-pointer">Entfernen</button>
            </div>
            <input type="text" value={h.display} onChange={(e) => update(i, { display: e.target.value })}
              placeholder="Schlagzeile mit _____"
              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm font-semibold" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input type="text" value={h.blanked_word} onChange={(e) => update(i, { blanked_word: e.target.value })}
                placeholder="Lösungswort (Anzeige)"
                className="rounded border border-gray-200 px-2 py-1.5 text-sm" />
              <ChipInput value={h.accepted_answers} onChange={(v) => update(i, { accepted_answers: v })}
                placeholder="Akzeptierte Varianten…" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input type="url" value={h.article_url} onChange={(e) => update(i, { article_url: e.target.value })}
                placeholder="article_url"
                className="rounded border border-gray-200 px-2 py-1.5 text-xs font-mono" />
              <input type="number" value={h.article_year} onChange={(e) => update(i, { article_year: parseInt(e.target.value) || 0 })}
                placeholder="Jahr"
                className="rounded border border-gray-200 px-2 py-1.5 text-xs" />
              <input type="text" value={h.article_date} onChange={(e) => update(i, { article_date: e.target.value })}
                placeholder="Datum"
                className="rounded border border-gray-200 px-2 py-1.5 text-xs" />
              <select value={h.category} onChange={(e) => update(i, { category: e.target.value })}
                className="rounded border border-gray-200 px-2 py-1.5 text-xs">
                {['Schweiz','International','Wirtschaft','Sport','Leben','Digital','Promi'].map(c =>
                  <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
              <select value={h.difficulty} onChange={(e) => update(i, { difficulty: parseInt(e.target.value) as 1|2|3 })}
                className="rounded border border-gray-200 px-2 py-1.5 text-xs">
                {[1,2,3].map(n => <option key={n} value={n}>D{n}</option>)}
              </select>
              <input type="text" value={h.context_hint ?? ''} onChange={(e) => update(i, { context_hint: e.target.value })}
                placeholder="Kontext-Hinweis (optional)"
                className="rounded border border-gray-200 px-2 py-1.5 text-xs" />
            </div>
          </div>
        ))}
      </div>
    </JsonModeToggle>
  );
}
