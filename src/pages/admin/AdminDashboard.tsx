import { Link } from 'react-router-dom';
import { SAMPLE_VERBINDIGE } from '@/games/verbindige/verbindige.data';
import { SAMPLE_ZAEMESETZLI } from '@/games/zaemesetzli/zaemesetzli.data';
import { SAMPLE_SCHLAGLOCH } from '@/games/schlagloch/schlagloch.data';

const games = [
  {
    title: 'Verbindige',
    path: '/admin/verbindige',
    color: 'var(--color-difficulty-1)',
    puzzleId: SAMPLE_VERBINDIGE.id,
    date: SAMPLE_VERBINDIGE.date,
    stat: `${SAMPLE_VERBINDIGE.groups.length} Gruppen, ${SAMPLE_VERBINDIGE.groups.reduce((n, g) => n + g.items.length, 0)} Begriffe`,
  },
  {
    title: 'Zaemesetzli',
    path: '/admin/zaemesetzli',
    color: 'var(--color-green)',
    puzzleId: SAMPLE_ZAEMESETZLI.id,
    date: SAMPLE_ZAEMESETZLI.date,
    stat: `${SAMPLE_ZAEMESETZLI.emojis.length} Emojis, ${SAMPLE_ZAEMESETZLI.valid_compounds.length} Woerter`,
  },
  {
    title: 'Schlagloch',
    path: '/admin/schlagloch',
    color: 'var(--color-blue)',
    puzzleId: SAMPLE_SCHLAGLOCH.id,
    date: SAMPLE_SCHLAGLOCH.date,
    stat: `${SAMPLE_SCHLAGLOCH.headlines.length} Schlagzeilen`,
  },
];

export function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold font-[var(--font-heading)] mb-6">
        Games Dashboard
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Link
            key={game.path}
            to={game.path}
            className="rounded-lg bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: game.color }}
              />
              <h2 className="text-lg font-bold">{game.title}</h2>
            </div>
            <div className="space-y-1 text-sm text-[var(--color-gray-text)]">
              <p>Puzzle: <span className="font-mono text-black">{game.puzzleId}</span></p>
              <p>Datum: {game.date}</p>
              <p>{game.stat}</p>
            </div>
            <div className="mt-4 text-xs font-semibold text-[var(--color-blue)]">
              Review &rarr;
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-lg bg-white p-5 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-3">Status</h2>
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div className="rounded bg-[#f0fdf4] p-3 border border-green-200">
            <p className="font-semibold text-green-800">Heute</p>
            <p className="text-green-600">Alle 3 Spiele bereit</p>
          </div>
          <div className="rounded bg-[#fffbeb] p-3 border border-yellow-200">
            <p className="font-semibold text-yellow-800">Morgen</p>
            <p className="text-yellow-600">Noch keine Puzzles</p>
          </div>
          <div className="rounded bg-gray-50 p-3 border border-gray-200">
            <p className="font-semibold text-gray-700">Datenquelle</p>
            <p className="text-gray-500">Lokal (*.data.ts)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
