import { SAMPLE_ZAEMESETZLI } from '@/games/zaemesetzli/zaemesetzli.data';

const DIFF_LABELS: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: 'Einfach', bg: 'bg-green-100', text: 'text-green-700' },
  2: { label: 'Mittel', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  3: { label: 'Schwer', bg: 'bg-red-100', text: 'text-red-700' },
};

export function AdminZaemesetzli() {
  const puzzle = SAMPLE_ZAEMESETZLI;
  const mundartCount = puzzle.valid_compounds.filter((c) => c.is_mundart).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Zaemesetzli Review</h1>
          <p className="text-sm text-[var(--color-gray-text)]">
            Puzzle <span className="font-mono">{puzzle.id}</span> &middot; {puzzle.date}
          </p>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          Bereit
        </span>
      </div>

      {/* Emoji palette */}
      <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100 mb-4">
        <h2 className="font-bold mb-3">Emoji-Palette</h2>
        <div className="flex flex-wrap gap-3">
          {puzzle.emojis.map((e) => (
            <div
              key={e.emoji}
              className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 border border-gray-100"
            >
              <span className="text-2xl">{e.emoji}</span>
              <div className="text-sm">
                <p className="font-semibold">{e.canonical_noun}</p>
                {e.alt_nouns.length > 0 && (
                  <p className="text-xs text-[var(--color-gray-text)]">
                    auch: {e.alt_nouns.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compounds table */}
      <div className="rounded-lg bg-white shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-bold">Gueltige Woerter ({puzzle.valid_compounds.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-[var(--color-gray-text)]">
              <th className="px-4 py-2 font-medium">Wort</th>
              <th className="px-4 py-2 font-medium">Emojis</th>
              <th className="px-4 py-2 font-medium">Schwierigkeit</th>
              <th className="px-4 py-2 font-medium text-right">Punkte</th>
              <th className="px-4 py-2 font-medium">Mundart</th>
            </tr>
          </thead>
          <tbody>
            {puzzle.valid_compounds.map((compound) => {
              const diff = DIFF_LABELS[compound.difficulty];
              return (
                <tr key={compound.word} className="border-t border-gray-50">
                  <td className="px-4 py-2 font-semibold">{compound.word}</td>
                  <td className="px-4 py-2 text-lg">{compound.components.join(' + ')}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${diff.bg} ${diff.text}`}>
                      {diff.label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono">{compound.points}</td>
                  <td className="px-4 py-2">
                    {compound.is_mundart && (
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                        Mundart
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scoring summary */}
      <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100 text-sm">
        <h3 className="font-bold mb-2">Scoring</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[var(--color-gray-text)]">Max. Punkte</p>
            <p className="text-xl font-bold">{puzzle.max_score}</p>
          </div>
          <div>
            <p className="text-[var(--color-gray-text)]">Mundart-Woerter</p>
            <p className="text-xl font-bold">{mundartCount}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[var(--color-gray-text)] mb-1">Rang-Schwellen</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(puzzle.rank_thresholds).map(([rank, pts]) => (
                <span key={rank} className="rounded bg-gray-100 px-2 py-1 text-xs font-mono">
                  {rank}: {pts}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
