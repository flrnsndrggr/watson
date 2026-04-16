import { SAMPLE_VERBINDIGE } from '@/games/verbindige/verbindige.data';

const DIFF_COLORS: Record<number, string> = {
  1: 'var(--color-difficulty-1)',
  2: 'var(--color-difficulty-2)',
  3: 'var(--color-difficulty-3)',
  4: 'var(--color-difficulty-4)',
};

export function AdminVerbindige() {
  const puzzle = SAMPLE_VERBINDIGE;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Verbindige Review</h1>
          <p className="text-sm text-[var(--color-gray-text)]">
            Puzzle <span className="font-mono">{puzzle.id}</span> &middot; {puzzle.date}
          </p>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          Bereit
        </span>
      </div>

      <div className="space-y-4">
        {puzzle.groups.map((group) => (
          <div
            key={group.category}
            className="rounded-lg bg-white shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Group header */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderLeft: `4px solid ${DIFF_COLORS[group.difficulty]}` }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: DIFF_COLORS[group.difficulty] }}
              >
                {group.difficulty}
              </span>
              <div>
                <h2 className="font-bold">{group.category}</h2>
                {group.category_label && group.category_label !== group.category && (
                  <p className="text-xs text-[var(--color-gray-text)]">{group.category_label}</p>
                )}
              </div>
            </div>

            {/* Items table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50 text-left text-xs text-[var(--color-gray-text)]">
                  <th className="px-4 py-2 font-medium">Mundart</th>
                  <th className="px-4 py-2 font-medium">Hochdeutsch</th>
                  <th className="px-4 py-2 font-medium">Region</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.text} className="border-t border-gray-50">
                    <td className="px-4 py-2 font-semibold">{item.text}</td>
                    <td className="px-4 py-2 text-[var(--color-gray-text)]">
                      {item.hochdeutsch ?? '—'}
                    </td>
                    <td className="px-4 py-2">
                      {item.region && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
                          {item.region}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 rounded-lg bg-white p-4 shadow-sm border border-gray-100 text-sm">
        <h3 className="font-bold mb-2">Zusammenfassung</h3>
        <ul className="space-y-1 text-[var(--color-gray-text)]">
          <li>{puzzle.groups.length} Gruppen</li>
          <li>{puzzle.groups.reduce((n, g) => n + g.items.length, 0)} Begriffe total</li>
          <li>
            Regionen: {[...new Set(puzzle.groups.flatMap((g) => g.items.map((i) => i.region)).filter(Boolean))].join(', ')}
          </li>
        </ul>
      </div>
    </div>
  );
}
