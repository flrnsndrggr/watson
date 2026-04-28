import type { VerbindigePuzzle, VerbindigeGroup, VerbindigeItem } from '@/types';
import { JsonModeToggle } from './JsonModeToggle';

const DIFF_COLORS: Record<number, string> = {
  1: 'var(--color-difficulty-1)',
  2: 'var(--color-difficulty-2)',
  3: 'var(--color-difficulty-3)',
  4: 'var(--color-difficulty-4)',
};

export type VerbindigePayload = Pick<VerbindigePuzzle, 'groups'>;

export function emptyVerbindige(): VerbindigePayload {
  const mk = (d: 1 | 2 | 3 | 4): VerbindigeGroup => ({
    category: '', category_label: '', difficulty: d,
    items: Array.from({ length: 4 }, (): VerbindigeItem => ({ text: '', hochdeutsch: '', region: '' })),
  });
  return { groups: [mk(1), mk(2), mk(3), mk(4)] };
}

function GroupEditor({
  group, index, onChange,
}: { group: VerbindigeGroup; index: number; onChange: (g: VerbindigeGroup) => void }) {
  const updateItem = (idx: number, field: keyof VerbindigeItem, value: string) => {
    onChange({ ...group, items: group.items.map((it, i) => i === idx ? { ...it, [field]: value } : it) });
  };
  return (
    <div className="rounded-lg bg-white shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderLeft: `4px solid ${DIFF_COLORS[group.difficulty]}` }}>
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: DIFF_COLORS[group.difficulty] }}
        >{group.difficulty}</span>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <input type="text" value={group.category} onChange={(e) => onChange({ ...group, category: e.target.value })}
            placeholder={`Gruppe ${index + 1} Kategorie`}
            className="rounded border border-gray-200 px-2 py-1.5 text-sm font-bold" />
          <input type="text" value={group.category_label ?? ''} onChange={(e) => onChange({ ...group, category_label: e.target.value })}
            placeholder="Label (Hochdeutsch)"
            className="rounded border border-gray-200 px-2 py-1.5 text-sm text-[var(--color-gray-text)]" />
        </div>
      </div>
      <div className="px-4 pb-3">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-[var(--color-gray-text)]">
            <th className="pb-1 font-medium">Mundart</th>
            <th className="pb-1 font-medium">Hochdeutsch</th>
            <th className="pb-1 font-medium w-20">Region</th>
          </tr></thead>
          <tbody>
            {group.items.map((it, i) => (
              <tr key={i}>
                <td className="pr-2 py-1"><input type="text" value={it.text}
                  onChange={(e) => updateItem(i, 'text', e.target.value)} placeholder="Wort..."
                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm font-semibold" /></td>
                <td className="pr-2 py-1"><input type="text" value={it.hochdeutsch ?? ''}
                  onChange={(e) => updateItem(i, 'hochdeutsch', e.target.value)} placeholder="Übersetzung..."
                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                <td className="py-1"><input type="text" value={it.region ?? ''}
                  onChange={(e) => updateItem(i, 'region', e.target.value)} placeholder="ZH"
                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm font-mono" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function VerbindigeForm({ value, onChange }: { value: VerbindigePayload; onChange: (v: VerbindigePayload) => void }) {
  return (
    <JsonModeToggle value={value} onChange={onChange}>
      <div className="space-y-3">
        <h2 className="font-bold text-sm uppercase text-[var(--color-gray-text)]">4 Gruppen à 4 Begriffe</h2>
        {value.groups.map((g, i) => (
          <GroupEditor key={i} group={g} index={i}
            onChange={(ng) => onChange({ ...value, groups: value.groups.map((x, j) => j === i ? ng : x) })} />
        ))}
      </div>
    </JsonModeToggle>
  );
}
