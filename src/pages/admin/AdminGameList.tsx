import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { GameType } from '@/types';
import { ALL_GAME_TYPES, GAME_LABELS, listPuzzlesAdmin, deriveStatus, type PuzzleRow } from '@/lib/cmsApi';

export function AdminGameList() {
  const { game } = useParams<{ game: string }>();
  const navigate = useNavigate();
  const [rows, setRows] = useState<PuzzleRow[] | null>(null);

  const gameType = useMemo<GameType | null>(() => {
    return ALL_GAME_TYPES.includes(game as GameType) ? (game as GameType) : null;
  }, [game]);

  useEffect(() => {
    if (!gameType) return;
    let cancelled = false;
    listPuzzlesAdmin(gameType).then((data) => {
      if (!cancelled) setRows(data);
    });
    return () => { cancelled = true; };
  }, [gameType]);

  if (!gameType) return <div className="rounded bg-red-50 border border-red-200 p-4 text-sm">Unknown game: {game}</div>;

  const today = new Date().toISOString().slice(0, 10);

  const drafts = (rows ?? []).filter(r => deriveStatus(r.publish_date, today) === 'draft');
  const scheduled = (rows ?? []).filter(r => deriveStatus(r.publish_date, today) === 'scheduled')
    .sort((a, b) => a.publish_date.localeCompare(b.publish_date));
  const published = (rows ?? []).filter(r => deriveStatus(r.publish_date, today) === 'published');

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link to="/admin/schedule" className="text-xs text-[var(--color-blue)] hover:underline">← Schedule</Link>
          <h1 className="text-2xl font-bold mt-1">{GAME_LABELS[gameType]}</h1>
        </div>
        <button onClick={() => navigate(`/admin/${gameType}/new`)}
          className="rounded bg-[var(--color-cyan)] px-4 py-2 text-sm font-semibold text-white hover:opacity-85 cursor-pointer">
          + Neues Puzzle
        </button>
      </div>

      {rows === null ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-cyan)] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          <ListSection title="Entwürfe" rows={drafts} gameType={gameType} pillClass="bg-gray-100 text-gray-600" />
          <ListSection title="Geplant" rows={scheduled} gameType={gameType} pillClass="bg-yellow-100 text-yellow-700" />
          <ListSection title="Live / Archiv" rows={published.slice(0, 30)} gameType={gameType} pillClass="bg-green-100 text-green-700" />
        </div>
      )}
    </div>
  );
}

function ListSection({
  title, rows, gameType, pillClass,
}: { title: string; rows: PuzzleRow[]; gameType: GameType; pillClass: string }) {
  return (
    <section>
      <h2 className="font-bold text-sm uppercase text-[var(--color-gray-text)] mb-2">
        {title} ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <p className="text-xs text-[var(--color-gray-text)]">—</p>
      ) : (
        <ul className="space-y-1">
          {rows.map(r => (
            <li key={r.id}>
              <Link to={`/admin/${gameType}/${r.id}`}
                className="flex items-center justify-between rounded border border-gray-100 bg-white px-3 py-2 hover:border-gray-300">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${pillClass}`}>
                    {title.split(' ')[0]}
                  </span>
                  <span className="font-mono text-sm">{r.publish_date}</span>
                </div>
                <span className="text-xs text-[var(--color-gray-text)] font-mono truncate max-w-[300px]">
                  {r.id}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
