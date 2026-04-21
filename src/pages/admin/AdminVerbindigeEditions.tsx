import { useCallback, useEffect, useState } from 'react';
import type { VerbindigeEdition, VerbindigeGroup, VerbindigeItem } from '@/types';
import { fetchAllEditions, upsertEdition, deleteEdition } from '@/lib/supabase';

const DIFF_COLORS: Record<number, string> = {
  1: 'var(--color-difficulty-1)',
  2: 'var(--color-difficulty-2)',
  3: 'var(--color-difficulty-3)',
  4: 'var(--color-difficulty-4)',
};

function emptyItem(): VerbindigeItem {
  return { text: '', hochdeutsch: '', region: '' };
}

function emptyGroup(difficulty: 1 | 2 | 3 | 4): VerbindigeGroup {
  return {
    category: '',
    category_label: '',
    difficulty,
    items: [emptyItem(), emptyItem(), emptyItem(), emptyItem()],
  };
}

function emptyEdition(): Omit<VerbindigeEdition, 'created_at' | 'updated_at'> {
  return {
    id: crypto.randomUUID(),
    slug: '',
    title: '',
    sponsor_name: '',
    sponsor_logo_url: null,
    sponsor_click_url: null,
    groups: [emptyGroup(1), emptyGroup(2), emptyGroup(3), emptyGroup(4)],
    status: 'draft',
    publish_date: null,
  };
}

// ----- Edition List View -----

function EditionList({
  editions,
  onEdit,
  onDelete,
  onCreate,
}: {
  editions: VerbindigeEdition[];
  onEdit: (e: VerbindigeEdition) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branded Editions</h1>
          <p className="text-sm text-[var(--color-gray-text)]">
            Sponsor-themed Verbindige puzzles
          </p>
        </div>
        <button
          onClick={onCreate}
          className="min-h-[44px] rounded bg-[var(--color-cyan)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 cursor-pointer"
        >
          + Neue Edition
        </button>
      </div>

      {editions.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm border border-gray-100">
          <p className="text-[var(--color-gray-text)]">Noch keine Branded Editions erstellt.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {editions.map((edition) => (
            <div
              key={edition.id}
              className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm border border-gray-100"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold truncate">{edition.title || 'Unbenannt'}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      edition.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {edition.status === 'published' ? 'Live' : 'Entwurf'}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-gray-text)] truncate">
                  Sponsor: {edition.sponsor_name || '—'} &middot;
                  Slug: <span className="font-mono">{edition.slug || '—'}</span>
                  {edition.publish_date && <> &middot; {edition.publish_date}</>}
                </p>
              </div>
              <div className="flex shrink-0 gap-2 ml-4">
                <button
                  onClick={() => onEdit(edition)}
                  className="min-h-[44px] rounded border border-gray-200 px-3 py-2 text-sm font-semibold transition-colors hover:bg-gray-50 cursor-pointer"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => onDelete(edition.id)}
                  className="min-h-[44px] rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----- Group Editor -----

function GroupEditor({
  group,
  index,
  onChange,
}: {
  group: VerbindigeGroup;
  index: number;
  onChange: (g: VerbindigeGroup) => void;
}) {
  const updateItem = (itemIdx: number, field: keyof VerbindigeItem, value: string) => {
    const newItems = group.items.map((item, i) =>
      i === itemIdx ? { ...item, [field]: value } : item,
    );
    onChange({ ...group, items: newItems });
  };

  return (
    <div className="rounded-lg bg-white shadow-sm border border-gray-100 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderLeft: `4px solid ${DIFF_COLORS[group.difficulty]}` }}
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: DIFF_COLORS[group.difficulty] }}
        >
          {group.difficulty}
        </span>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <input
            type="text"
            value={group.category}
            onChange={(e) => onChange({ ...group, category: e.target.value })}
            placeholder={`Gruppe ${index + 1} Kategorie`}
            className="rounded border border-gray-200 px-2 py-1.5 text-sm font-bold"
            aria-label={`Gruppe ${index + 1} Kategorie`}
          />
          <input
            type="text"
            value={group.category_label ?? ''}
            onChange={(e) => onChange({ ...group, category_label: e.target.value })}
            placeholder="Label (Hochdeutsch)"
            className="rounded border border-gray-200 px-2 py-1.5 text-sm text-[var(--color-gray-text)]"
            aria-label={`Gruppe ${index + 1} Label`}
          />
        </div>
      </div>

      <div className="px-4 pb-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--color-gray-text)]">
              <th className="pb-1 font-medium">Mundart</th>
              <th className="pb-1 font-medium">Hochdeutsch</th>
              <th className="pb-1 font-medium w-20">Region</th>
            </tr>
          </thead>
          <tbody>
            {group.items.map((item, i) => (
              <tr key={i}>
                <td className="pr-2 py-1">
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateItem(i, 'text', e.target.value)}
                    placeholder="Wort..."
                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm font-semibold"
                    aria-label={`Gruppe ${index + 1} Wort ${i + 1}`}
                  />
                </td>
                <td className="pr-2 py-1">
                  <input
                    type="text"
                    value={item.hochdeutsch ?? ''}
                    onChange={(e) => updateItem(i, 'hochdeutsch', e.target.value)}
                    placeholder="Übersetzung..."
                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                    aria-label={`Gruppe ${index + 1} Übersetzung ${i + 1}`}
                  />
                </td>
                <td className="py-1">
                  <input
                    type="text"
                    value={item.region ?? ''}
                    onChange={(e) => updateItem(i, 'region', e.target.value)}
                    placeholder="ZH"
                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm font-mono"
                    aria-label={`Gruppe ${index + 1} Region ${i + 1}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----- Edition Editor -----

function EditionEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<VerbindigeEdition, 'created_at' | 'updated_at'>;
  onSave: (e: Omit<VerbindigeEdition, 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}) {
  const [edition, setEdition] = useState(initial);
  const [errors, setErrors] = useState<string[]>([]);

  const updateGroup = (index: number, group: VerbindigeGroup) => {
    const newGroups = edition.groups.map((g, i) => (i === index ? group : g));
    setEdition({ ...edition, groups: newGroups });
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!edition.slug.trim()) errs.push('Slug ist erforderlich');
    if (!/^[a-z0-9-]+$/.test(edition.slug)) errs.push('Slug: nur Kleinbuchstaben, Zahlen, Bindestriche');
    if (!edition.title.trim()) errs.push('Titel ist erforderlich');
    if (!edition.sponsor_name.trim()) errs.push('Sponsor-Name ist erforderlich');
    if (edition.groups.length !== 4) errs.push('Genau 4 Gruppen erforderlich');
    for (let gi = 0; gi < edition.groups.length; gi++) {
      const g = edition.groups[gi];
      if (!g.category.trim()) errs.push(`Gruppe ${gi + 1}: Kategorie fehlt`);
      for (let ii = 0; ii < g.items.length; ii++) {
        if (!g.items[ii].text.trim()) errs.push(`Gruppe ${gi + 1}, Wort ${ii + 1}: Text fehlt`);
      }
    }
    // Check for duplicate words
    const allWords = edition.groups.flatMap((g) => g.items.map((i) => i.text.trim().toLowerCase()));
    const seen = new Set<string>();
    for (const w of allWords) {
      if (w && seen.has(w)) errs.push(`Doppeltes Wort: "${w}"`);
      seen.add(w);
    }
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length === 0) onSave(edition);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {initial.slug ? 'Edition bearbeiten' : 'Neue Edition'}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="min-h-[44px] rounded border border-gray-200 px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-50 cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="min-h-[44px] rounded bg-[var(--color-cyan)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 cursor-pointer"
          >
            Speichern
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
          <ul className="list-disc pl-4 text-sm text-red-700">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sponsor & Meta */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm border border-gray-100 space-y-3">
        <h2 className="font-bold text-sm uppercase text-[var(--color-gray-text)]">Sponsor & Meta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-gray-text)] mb-1">
              Titel *
            </label>
            <input
              type="text"
              value={edition.title}
              onChange={(e) => setEdition({ ...edition, title: e.target.value })}
              placeholder="z.B. Migros Verbindige"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              aria-label="Edition Titel"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-gray-text)] mb-1">
              Slug * <span className="font-normal">(URL-Pfad)</span>
            </label>
            <input
              type="text"
              value={edition.slug}
              onChange={(e) =>
                setEdition({ ...edition, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
              }
              placeholder="z.B. migros-sommer-2026"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm font-mono"
              aria-label="Edition Slug"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-gray-text)] mb-1">
              Sponsor-Name *
            </label>
            <input
              type="text"
              value={edition.sponsor_name}
              onChange={(e) => setEdition({ ...edition, sponsor_name: e.target.value })}
              placeholder="z.B. Migros"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              aria-label="Sponsor Name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-gray-text)] mb-1">
              Sponsor Logo URL
            </label>
            <input
              type="url"
              value={edition.sponsor_logo_url ?? ''}
              onChange={(e) => setEdition({ ...edition, sponsor_logo_url: e.target.value || null })}
              placeholder="https://..."
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              aria-label="Sponsor Logo URL"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-gray-text)] mb-1">
              Sponsor Link URL
            </label>
            <input
              type="url"
              value={edition.sponsor_click_url ?? ''}
              onChange={(e) => setEdition({ ...edition, sponsor_click_url: e.target.value || null })}
              placeholder="https://..."
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              aria-label="Sponsor Link URL"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-gray-text)] mb-1">
              Publish Date
            </label>
            <input
              type="date"
              value={edition.publish_date ?? ''}
              onChange={(e) => setEdition({ ...edition, publish_date: e.target.value || null })}
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              aria-label="Publish Date"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={edition.status === 'published'}
              onChange={(e) =>
                setEdition({ ...edition, status: e.target.checked ? 'published' : 'draft' })
              }
              className="h-4 w-4"
            />
            <span className="font-semibold">Veröffentlicht</span>
          </label>
          {edition.status === 'published' && edition.slug && (
            <span className="text-xs text-[var(--color-gray-text)]">
              Spielbar unter: /verbindige/edition/{edition.slug}
            </span>
          )}
        </div>
      </div>

      {/* Groups */}
      <h2 className="mb-3 font-bold text-sm uppercase text-[var(--color-gray-text)]">
        4 Gruppen à 4 Begriffe
      </h2>
      <div className="space-y-4">
        {edition.groups.map((group, i) => (
          <GroupEditor key={i} group={group} index={i} onChange={(g) => updateGroup(i, g)} />
        ))}
      </div>

      {/* Bottom save bar */}
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="min-h-[44px] rounded border border-gray-200 px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-50 cursor-pointer"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          className="min-h-[44px] rounded bg-[var(--color-cyan)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 cursor-pointer"
        >
          Speichern
        </button>
      </div>
    </div>
  );
}

// ----- Main Page -----

export function AdminVerbindigeEditions() {
  const [editions, setEditions] = useState<VerbindigeEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Omit<VerbindigeEdition, 'created_at' | 'updated_at'> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllEditions();
    setEditions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAllEditions().then((data) => {
      if (!cancelled) {
        setEditions(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (
    edition: Omit<VerbindigeEdition, 'created_at' | 'updated_at'>,
  ) => {
    const result = await upsertEdition(edition);
    if (result) {
      setEditing(null);
      void load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Diese Edition wirklich löschen?')) return;
    const ok = await deleteEdition(id);
    if (ok) void load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-cyan)] border-t-transparent" />
      </div>
    );
  }

  if (editing) {
    return (
      <EditionEditor
        initial={editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <EditionList
      editions={editions}
      onEdit={(e) =>
        setEditing({
          id: e.id,
          slug: e.slug,
          title: e.title,
          sponsor_name: e.sponsor_name,
          sponsor_logo_url: e.sponsor_logo_url,
          sponsor_click_url: e.sponsor_click_url,
          groups: e.groups,
          status: e.status,
          publish_date: e.publish_date,
        })
      }
      onDelete={handleDelete}
      onCreate={() => setEditing(emptyEdition())}
    />
  );
}
