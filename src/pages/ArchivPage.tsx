import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { fetchPuzzleDates } from '@/lib/supabase';
import type { GameType } from '@/types';

const GAME_INFO: Record<string, { name: string; emoji: string; path: string; color: string }> = {
  verbindige: { name: 'Verbindige', emoji: '🇨🇭', path: '/verbindige', color: 'var(--color-cyan)' },
  zaemesetzli: { name: 'Zämesetzli', emoji: '🧩', path: '/zaemesetzli', color: 'var(--color-green)' },
  schlagziil: { name: 'Schlagziil', emoji: '📰', path: '/schlagziil', color: 'var(--color-cyan)' },
};

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

interface PuzzleDate {
  publish_date: string;
  game_type: GameType;
}

function getMonthDays(year: number, month: number): { date: number; dayOfWeek: number }[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { date: number; dayOfWeek: number }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    // 0=Sun..6=Sat → convert to Mon=0..Sun=6
    const jsDay = new Date(year, month, d).getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
    days.push({ date: d, dayOfWeek });
  }
  return days;
}

function CalendarMonth({
  year,
  month,
  puzzlesByDate,
  selectedDate,
  onSelectDate,
}: {
  year: number;
  month: number;
  puzzlesByDate: Map<string, GameType[]>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  const days = getMonthDays(year, month);
  const firstDayOffset = days[0]?.dayOfWeek ?? 0;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-[var(--color-gray-text)] py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOffset }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(({ date }) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
          const games = puzzlesByDate.get(dateStr);
          const hasPuzzles = games && games.length > 0;
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={date}
              onClick={() => hasPuzzles && onSelectDate(dateStr)}
              disabled={!hasPuzzles}
              className={`
                relative flex h-10 w-full items-center justify-center rounded-md text-sm transition-all
                ${hasPuzzles
                  ? isSelected
                    ? 'bg-[var(--color-cyan)] text-white font-bold'
                    : 'bg-[var(--color-gray-bg)] text-[var(--color-black)] font-medium hover:bg-[var(--color-cyan)]/20 cursor-pointer'
                  : 'text-[var(--color-gray-text)]/40 cursor-default'
                }
              `}
              aria-label={hasPuzzles ? `${date}. ${MONTH_NAMES[month]} — ${games.length} ${games.length === 1 ? 'Spiel' : 'Spiele'}` : undefined}
            >
              {date}
              {hasPuzzles && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {games.map((g) => (
                    <span
                      key={g}
                      className="block h-1 w-1 rounded-full"
                      style={{ backgroundColor: GAME_INFO[g]?.color ?? 'var(--color-cyan)' }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ArchivPage() {
  const [puzzleDates, setPuzzleDates] = useState<PuzzleDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Current calendar month view
  const [viewYear, setViewYear] = useState(() => {
    const now = new Date();
    return parseInt(now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }).split('-')[0], 10);
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return parseInt(now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }).split('-')[1], 10) - 1;
  });

  useEffect(() => {
    let cancelled = false;
    fetchPuzzleDates().then((data) => {
      if (!cancelled) {
        setPuzzleDates(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Group puzzle dates: date string → array of game types
  const puzzlesByDate = useMemo(() => {
    const map = new Map<string, GameType[]>();
    for (const { publish_date, game_type } of puzzleDates) {
      const existing = map.get(publish_date);
      if (existing) {
        if (!existing.includes(game_type)) existing.push(game_type);
      } else {
        map.set(publish_date, [game_type]);
      }
    }
    return map;
  }, [puzzleDates]);

  // Available months for navigation bounds
  const { minDate, maxDate } = useMemo(() => {
    if (puzzleDates.length === 0) return { minDate: null, maxDate: null };
    const sorted = puzzleDates.map((d) => d.publish_date).sort();
    return { minDate: sorted[0], maxDate: sorted[sorted.length - 1] };
  }, [puzzleDates]);

  const gamesForSelectedDate = selectedDate ? puzzlesByDate.get(selectedDate) ?? [] : [];

  function navigateMonth(delta: number) {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth < 0) { newMonth = 11; newYear -= 1; }
    if (newMonth > 11) { newMonth = 0; newYear += 1; }
    setViewMonth(newMonth);
    setViewYear(newYear);
    setSelectedDate(null);
  }

  const canGoPrev = minDate
    ? viewYear > parseInt(minDate.split('-')[0], 10) ||
      (viewYear === parseInt(minDate.split('-')[0], 10) && viewMonth > parseInt(minDate.split('-')[1], 10) - 1)
    : false;

  const canGoNext = maxDate
    ? viewYear < parseInt(maxDate.split('-')[0], 10) ||
      (viewYear === parseInt(maxDate.split('-')[0], 10) && viewMonth < parseInt(maxDate.split('-')[1], 10) - 1)
    : false;

  return (
    <GameShell>
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold">
          Archiv
        </h1>
        <p className="mt-1 text-sm text-[var(--color-gray-text)]">
          Spiele vergangene Rätsel — ohne Streak-Wertung.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {/* Calendar skeleton */}
          <div className="h-8 w-48 mx-auto rounded bg-[var(--color-gray-bg)] animate-pulse" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="h-10 rounded-md bg-[var(--color-gray-bg)] animate-pulse" />
            ))}
          </div>
        </div>
      ) : puzzleDates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--color-gray-text)]">Noch keine vergangenen Rätsel vorhanden.</p>
          <Link to="/" className="mt-3 inline-block text-sm text-[var(--color-cyan)] hover:underline">
            ← Zurück zu den Spielen
          </Link>
        </div>
      ) : (
        <>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              disabled={!canGoPrev}
              className={`rounded p-2 text-sm font-semibold transition-colors ${
                canGoPrev
                  ? 'text-[var(--color-black)] hover:bg-[var(--color-gray-bg)] cursor-pointer'
                  : 'text-[var(--color-gray-text)]/30 cursor-default'
              }`}
              aria-label="Vorheriger Monat"
            >
              ←
            </button>
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              disabled={!canGoNext}
              className={`rounded p-2 text-sm font-semibold transition-colors ${
                canGoNext
                  ? 'text-[var(--color-black)] hover:bg-[var(--color-gray-bg)] cursor-pointer'
                  : 'text-[var(--color-gray-text)]/30 cursor-default'
              }`}
              aria-label="Nächster Monat"
            >
              →
            </button>
          </div>

          {/* Calendar grid */}
          <CalendarMonth
            year={viewYear}
            month={viewMonth}
            puzzlesByDate={puzzlesByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* Selected date — show available games */}
          {selectedDate && gamesForSelectedDate.length > 0 && (
            <div className="mt-6 animate-[resultSlideUp_300ms_ease-out]">
              <h3 className="text-sm font-semibold text-[var(--color-gray-text)] mb-3">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('de-CH', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              <div className="flex flex-col gap-2">
                {gamesForSelectedDate.map((gameType) => {
                  const info = GAME_INFO[gameType];
                  if (!info) return null;
                  return (
                    <Link
                      key={gameType}
                      to={`${info.path}?date=${selectedDate}`}
                      className="group flex items-center gap-3 rounded-lg border-2 border-[var(--color-gray-bg)] p-3.5 transition-all hover:border-[var(--color-cyan)] hover:shadow-sm active:scale-[0.98]"
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl transition-transform group-hover:scale-105"
                        style={{ background: `color-mix(in srgb, ${info.color} 12%, transparent)` }}
                      >
                        {info.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-[family-name:var(--font-heading)] text-sm font-bold leading-tight">
                          {info.name}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-gray-text)]">
                          Archiv — ohne Streak
                        </p>
                      </div>
                      <span
                        className="text-sm text-[var(--color-gray-text)] transition-transform group-hover:translate-x-1 shrink-0"
                        aria-hidden
                      >
                        →
                      </span>
                    </Link>
                  );
                })}
              </div>

              <p className="mt-3 text-center text-xs text-[var(--color-gray-text)] italic">
                Archiv-Spiele zählen nicht zum Streak.
              </p>
            </div>
          )}
        </>
      )}
    </GameShell>
  );
}
