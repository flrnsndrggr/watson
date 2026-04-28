import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GameType } from '@/types';
import { ALL_GAME_TYPES, GAME_LABELS, GAME_COLORS, listAllSchedule, deriveStatus, DRAFT_DATE, type PuzzleRow } from '@/lib/cmsApi';

interface GameSummary {
  drafts: number;
  scheduled: number;
  publishedRecent: number;
  next7Gaps: string[];
}

function summarize(gameType: GameType, rows: PuzzleRow[], todayStr: string): GameSummary {
  const my = rows.filter(r => r.game_type === gameType);
  const drafts = my.filter(r => r.publish_date === DRAFT_DATE).length;
  const scheduled = my.filter(r => deriveStatus(r.publish_date, todayStr) === 'scheduled').length;
  const publishedRecent = my.filter(r => deriveStatus(r.publish_date, todayStr) === 'published').length;

  const next7Gaps: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + i);
    const ds = d.toISOString().slice(0, 10);
    if (!my.some(r => r.publish_date === ds)) next7Gaps.push(ds);
  }

  return { drafts, scheduled, publishedRecent, next7Gaps };
}

export function AdminDashboard() {
  const [rows, setRows] = useState<PuzzleRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const today = new Date();
    const from = new Date(today); from.setUTCDate(from.getUTCDate() - 30);
    const to = new Date(today);   to.setUTCDate(to.getUTCDate() + 60);
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);
    listAllSchedule({ from: fromStr, to: toStr }).then((data) => {
      if (!cancelled) {
        // Drafts use sentinel date 9999-12-31 — fetch them separately so the
        // window query doesn't filter them out.
        listAllSchedule({ from: DRAFT_DATE, to: DRAFT_DATE }).then((draftRows) => {
          if (!cancelled) setRows([...data, ...draftRows]);
        });
      }
    });
    return () => { cancelled = true; };
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to="/admin/schedule"
          className="rounded bg-[var(--color-cyan)] px-4 py-2 text-sm font-semibold text-white hover:opacity-85 cursor-pointer">
          → Schedule
        </Link>
      </div>

      {rows === null ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-cyan)] border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_GAME_TYPES.map((gt) => {
            const s = summarize(gt, rows, todayStr);
            return (
              <Link key={gt} to={`/admin/${gt}`}
                className="rounded-lg bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: GAME_COLORS[gt] }} />
                  <h2 className="font-bold">{GAME_LABELS[gt]}</h2>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
                  <Stat label="Entwürfe" value={s.drafts} />
                  <Stat label="Geplant" value={s.scheduled} />
                  <Stat label="Publiziert" value={s.publishedRecent} />
                </div>
                {s.next7Gaps.length > 0 ? (
                  <p className="mt-2 text-xs text-red-600">
                    {s.next7Gaps.length}/7 Tage ohne Puzzle
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-green-600">
                    Nächste 7 Tage abgedeckt
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-8 rounded-lg bg-white p-4 shadow-sm border border-gray-100">
        <h2 className="font-bold mb-2">Branded Editions</h2>
        <p className="text-xs text-[var(--color-gray-text)] mb-3">
          Sponsorierte Verbindige-Editionen werden separat verwaltet.
        </p>
        <Link to="/admin/verbindige-editions"
          className="inline-block rounded border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50">
          → Editions verwalten
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-gray-50 p-2">
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="text-[10px] text-[var(--color-gray-text)] uppercase">{label}</div>
    </div>
  );
}
