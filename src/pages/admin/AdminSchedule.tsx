import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GameType } from '@/types';
import { ALL_GAME_TYPES, GAME_LABELS, GAME_COLORS, listAllSchedule, deriveStatus, DRAFT_DATE, type PuzzleRow } from '@/lib/cmsApi';

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthRange(year: number, month0: number): { from: string; to: string; days: string[] } {
  const first = new Date(Date.UTC(year, month0, 1));
  const last = new Date(Date.UTC(year, month0 + 1, 0));
  const days: string[] = [];
  for (let d = 1; d <= last.getUTCDate(); d++) {
    days.push(ymd(new Date(Date.UTC(year, month0, d))));
  }
  return { from: ymd(first), to: ymd(last), days };
}

const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

export function AdminSchedule() {
  const today = new Date();
  const [year, setYear] = useState(today.getUTCFullYear());
  const [month0, setMonth0] = useState(today.getUTCMonth());
  const [rows, setRows] = useState<PuzzleRow[] | null>(null);

  const range = useMemo(() => monthRange(year, month0), [year, month0]);
  const todayStr = ymd(today);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    listAllSchedule({ from: range.from, to: range.to }).then((data) => {
      if (!cancelled) setRows(data);
    });
    return () => { cancelled = true; };
  }, [range.from, range.to]);

  // Bucket by (game_type, publish_date).
  const cellMap = useMemo(() => {
    const m = new Map<string, PuzzleRow>();
    (rows ?? []).forEach(r => m.set(`${r.game_type}|${r.publish_date}`, r));
    return m;
  }, [rows]);

  const stepMonth = (delta: number) => {
    let y = year, m = month0 + delta;
    if (m < 0) { y--; m += 12; }
    if (m > 11) { y++; m -= 12; }
    setYear(y); setMonth0(m);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => stepMonth(-1)}
            className="rounded border border-gray-200 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50 cursor-pointer">←</button>
          <span className="font-semibold w-24 text-center">{MONTHS[month0]} {year}</span>
          <button onClick={() => stepMonth(1)}
            className="rounded border border-gray-200 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50 cursor-pointer">→</button>
        </div>
      </div>

      {rows === null ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-cyan)] border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[#f5f5f5] border-b border-gray-200 px-2 py-1 text-left">Game</th>
                {range.days.map(d => {
                  const day = parseInt(d.slice(8, 10), 10);
                  const isToday = d === todayStr;
                  return (
                    <th key={d}
                      className={`border-b border-gray-200 px-1 py-1 text-center font-mono w-8 ${isToday ? 'bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]' : ''}`}>
                      {day}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ALL_GAME_TYPES.map(gt => (
                <tr key={gt}>
                  <td className="sticky left-0 z-10 bg-white border-b border-gray-100 px-2 py-1 font-semibold whitespace-nowrap"
                    style={{ borderLeft: `4px solid ${GAME_COLORS[gt]}` }}>
                    <Link to={`/admin/${gt}`} className="hover:underline">
                      {GAME_LABELS[gt]}
                    </Link>
                  </td>
                  {range.days.map(d => {
                    const row = cellMap.get(`${gt}|${d}`);
                    const status = row ? deriveStatus(row.publish_date, todayStr) : null;
                    return (
                      <Cell key={d} gameType={gt} date={d} row={row ?? null} status={status} todayStr={todayStr} />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drafts strip */}
      <DraftsStrip rows={rows} />

      <div className="mt-6 text-xs text-[var(--color-gray-text)] flex flex-wrap gap-4">
        <Legend color="bg-green-100 border-green-300" label="Live" />
        <Legend color="bg-yellow-100 border-yellow-300" label="Geplant" />
        <Legend color="bg-red-50 border-red-300" label="Lücke (≤ 3 Tage)" />
        <Legend color="bg-white border-gray-200" label="Frei" />
        <span>Sentinel-Datum {DRAFT_DATE} = Entwurf, unten gelistet.</span>
      </div>
    </div>
  );
}

function Cell({
  gameType, date, row, status, todayStr,
}: { gameType: GameType; date: string; row: PuzzleRow | null; status: ReturnType<typeof deriveStatus> | null; todayStr: string }) {
  let cls = 'border-b border-r border-gray-100 w-8 h-8 text-center align-middle';
  let pillCls = '';
  if (status === 'published') pillCls = 'bg-green-100 hover:bg-green-200';
  else if (status === 'scheduled') pillCls = 'bg-yellow-100 hover:bg-yellow-200';
  else {
    // Empty cell. Highlight near-future gaps.
    const diff = (Date.parse(date) - Date.parse(todayStr)) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff <= 3) pillCls = 'bg-red-50 hover:bg-red-100 border border-red-200';
    else pillCls = 'bg-white hover:bg-gray-50';
  }

  if (row) {
    return (
      <td className={cls}>
        <Link to={`/admin/${gameType}/${row.id}`}
          className={`block w-full h-full ${pillCls} cursor-pointer`}
          title={`${gameType} • ${date} • ${status}`} />
      </td>
    );
  }
  return (
    <td className={cls}>
      <Link to={`/admin/${gameType}/new?date=${date}`}
        className={`block w-full h-full text-[10px] text-[var(--color-gray-text)] leading-8 ${pillCls} cursor-pointer`}
        title={`${gameType} • ${date} • leer`}>+</Link>
    </td>
  );
}

function DraftsStrip({ rows }: { rows: PuzzleRow[] | null }) {
  const drafts = (rows ?? []).filter(r => r.publish_date === DRAFT_DATE);
  if (drafts.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="font-bold text-sm uppercase text-[var(--color-gray-text)] mb-2">
        Entwürfe ohne Datum ({drafts.length})
      </h2>
      <div className="flex flex-wrap gap-2">
        {drafts.map(r => (
          <Link key={r.id} to={`/admin/${r.game_type}/${r.id}`}
            className="rounded border border-gray-200 bg-white px-3 py-1.5 text-xs hover:bg-gray-50">
            <span className="font-semibold">{GAME_LABELS[r.game_type]}</span>
            <span className="ml-2 font-mono text-[var(--color-gray-text)]">{r.id.slice(0, 8)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-3 w-3 rounded ${color}`} />
      {label}
    </span>
  );
}
