import type { ZaemesetzliPuzzle, EmojiItem, CompoundWord } from '@/types';
import { JsonModeToggle, ChipInput } from './JsonModeToggle';

export type ZaemesetzliPayload = Pick<ZaemesetzliPuzzle, 'emojis' | 'valid_compounds' | 'max_score' | 'rank_thresholds'>;

export function emptyZaemesetzli(): ZaemesetzliPayload {
  return {
    emojis: Array.from({ length: 10 }, (): EmojiItem => ({ emoji: '', canonical_noun: '', alt_nouns: [] })),
    valid_compounds: [],
    max_score: 15,
    rank_thresholds: { stift: 0, lehrling: 3, geselle: 7, meister: 11, bundesrat: 14 },
  };
}

export function ZaemesetzliForm({ value, onChange }: { value: ZaemesetzliPayload; onChange: (v: ZaemesetzliPayload) => void }) {
  const updateEmoji = (i: number, patch: Partial<EmojiItem>) =>
    onChange({ ...value, emojis: value.emojis.map((e, j) => j === i ? { ...e, ...patch } : e) });
  const updateCompound = (i: number, patch: Partial<CompoundWord>) =>
    onChange({ ...value, valid_compounds: value.valid_compounds.map((c, j) => j === i ? { ...c, ...patch } : c) });
  const addCompound = () => onChange({
    ...value,
    valid_compounds: [...value.valid_compounds, { word: '', components: [], difficulty: 1, points: 1, is_mundart: false }],
  });
  const removeCompound = (i: number) => onChange({
    ...value,
    valid_compounds: value.valid_compounds.filter((_, j) => j !== i),
  });

  return (
    <JsonModeToggle value={value} onChange={onChange}>
      <div className="space-y-6">
        <section>
          <h2 className="font-bold text-sm uppercase text-[var(--color-gray-text)] mb-3">10 Emojis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {value.emojis.map((e, i) => (
              <div key={i} className="rounded border border-gray-200 bg-white p-2">
                <div className="flex items-center gap-2 mb-1">
                  <input type="text" value={e.emoji} onChange={(ev) => updateEmoji(i, { emoji: ev.target.value })}
                    placeholder="🏠" className="w-12 rounded border border-gray-200 px-2 py-1.5 text-center text-lg" />
                  <input type="text" value={e.canonical_noun} onChange={(ev) => updateEmoji(i, { canonical_noun: ev.target.value })}
                    placeholder="Kanonischer Begriff" className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm font-semibold" />
                </div>
                <ChipInput value={e.alt_nouns} onChange={(v) => updateEmoji(i, { alt_nouns: v })}
                  placeholder="Alt-Bedeutungen…" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm uppercase text-[var(--color-gray-text)]">Gültige Komposita</h2>
            <button type="button" onClick={addCompound}
              className="rounded bg-[var(--color-cyan)] px-2 py-1 text-xs font-semibold text-white cursor-pointer">
              + Hinzufügen
            </button>
          </div>
          <div className="space-y-2">
            {value.valid_compounds.map((c, i) => (
              <div key={i} className="rounded border border-gray-200 bg-white p-2 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
                  <input type="text" value={c.word} onChange={(e) => updateCompound(i, { word: e.target.value })}
                    placeholder="Wort" className="rounded border border-gray-200 px-2 py-1.5 text-sm font-semibold" />
                  <select value={c.difficulty} onChange={(e) => updateCompound(i, { difficulty: parseInt(e.target.value) as 1|2|3 })}
                    className="rounded border border-gray-200 px-2 py-1.5 text-sm">
                    {[1,2,3].map(n => <option key={n} value={n}>D{n}</option>)}
                  </select>
                  <input type="number" value={c.points} onChange={(e) => updateCompound(i, { points: parseInt(e.target.value) || 0 })}
                    className="w-16 rounded border border-gray-200 px-2 py-1.5 text-sm" placeholder="Pkt" />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={c.is_mundart}
                      onChange={(e) => updateCompound(i, { is_mundart: e.target.checked })} /> Mundart
                  </label>
                  <button type="button" onClick={() => removeCompound(i)}
                    className="text-red-600 text-xs hover:underline cursor-pointer">Entf.</button>
                </div>
                <ChipInput value={c.components} onChange={(v) => updateCompound(i, { components: v })}
                  placeholder="Emoji-Komponenten (Enter)…" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-bold text-sm uppercase text-[var(--color-gray-text)] mb-3">Score & Ränge</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <label className="text-xs">
              max_score
              <input type="number" value={value.max_score} onChange={(e) => onChange({ ...value, max_score: parseInt(e.target.value) || 0 })}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
            </label>
            {(['lehrling','geselle','meister','bundesrat'] as const).map(rank => (
              <label key={rank} className="text-xs capitalize">{rank}
                <input type="number" value={value.rank_thresholds[rank]}
                  onChange={(e) => onChange({ ...value, rank_thresholds: { ...value.rank_thresholds, [rank]: parseInt(e.target.value) || 0 } })}
                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
              </label>
            ))}
          </div>
        </section>
      </div>
    </JsonModeToggle>
  );
}
