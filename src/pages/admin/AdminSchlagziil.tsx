import { SAMPLE_SCHLAGZIIL, DEMO_ANSWERS } from '@/games/schlagziil/schlagziil.data';

const DIFF_LABELS: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: 'Einfach', bg: 'bg-green-100', text: 'text-green-700' },
  2: { label: 'Mittel', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  3: { label: 'Schwer', bg: 'bg-red-100', text: 'text-red-700' },
};

export function AdminSchlagziil() {
  const puzzle = SAMPLE_SCHLAGZIIL;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schlagziil Review</h1>
          <p className="text-sm text-[var(--color-gray-text)]">
            Puzzle <span className="font-mono">{puzzle.id}</span> &middot; {puzzle.date}
          </p>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          Bereit
        </span>
      </div>

      <div className="space-y-4">
        {puzzle.headlines.map((headline, i) => {
          const diff = DIFF_LABELS[headline.difficulty];
          const answers = DEMO_ANSWERS[i];

          return (
            <div
              key={i}
              className="rounded-lg bg-white shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-[var(--color-gray-text)]">#{i + 1}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${diff.bg} ${diff.text}`}>
                      {diff.label}
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-[var(--color-gray-text)]">
                      {headline.category}
                    </span>
                  </div>
                  <p className="text-base font-semibold leading-snug">{headline.display}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[var(--color-gray-text)]">Antwort(en)</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {answers?.map((a) => (
                        <span
                          key={a}
                          className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-gray-text)]">Artikel</p>
                    <p className="text-xs mt-1">
                      {headline.article_date} ({headline.article_year})
                    </p>
                  </div>
                  {headline.context_hint && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-[var(--color-gray-text)]">Hinweis</p>
                      <p className="text-xs mt-1 italic">{headline.context_hint}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 rounded-lg bg-white p-4 shadow-sm border border-gray-100 text-sm">
        <h3 className="font-bold mb-2">Zusammenfassung</h3>
        <ul className="space-y-1 text-[var(--color-gray-text)]">
          <li>{puzzle.headlines.length} Schlagzeilen</li>
          <li>
            Schwierigkeiten: {puzzle.headlines.filter((h) => h.difficulty === 1).length} einfach,{' '}
            {puzzle.headlines.filter((h) => h.difficulty === 2).length} mittel,{' '}
            {puzzle.headlines.filter((h) => h.difficulty === 3).length} schwer
          </li>
          <li>
            Kategorien: {[...new Set(puzzle.headlines.map((h) => h.category))].join(', ')}
          </li>
          <li>
            Zeitraum: {Math.min(...puzzle.headlines.map((h) => h.article_year))}–
            {Math.max(...puzzle.headlines.map((h) => h.article_year))}
          </li>
        </ul>
      </div>
    </div>
  );
}
