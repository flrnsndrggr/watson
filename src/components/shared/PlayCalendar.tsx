import { useState, useMemo } from 'react';
import { getPlayHistory, type DayResults, type DailyResult } from '@/lib/dailyResults';
import type { GameType } from '@/types';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const GAME_META: Record<GameType, { name: string; emoji: string; color: string }> = {
  verbindige: { name: 'Verbindige', emoji: '🇨🇭', color: 'var(--color-cyan)' },
  zaemesetzli: { name: 'Zämesetzli', emoji: '🧩', color: 'var(--color-green)' },
  schlagloch: { name: 'Schlagloch', emoji: '📰', color: 'var(--color-pink)' },
  quizzhuber: { name: 'Quizzhuber', emoji: '🤔', color: 'var(--color-blue)' },
  aufgedeckt: { name: 'Aufgedeckt', emoji: '🔍', color: 'var(--color-cyan)' },
  quizzticle: { name: 'Quizzticle', emoji: '⏱', color: 'var(--color-pink)' },
};

const ALL_GAMES: GameType[] = [
  'verbindige', 'zaemesetzli', 'schlagloch',
  'quizzhuber', 'aufgedeckt', 'quizzticle',
];

function getToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
}

function getMonthDays(year: number, month: number): { date: number; dayOfWeek: number }[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { date: number; dayOfWeek: number }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const jsDay = new Date(year, month, d).getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Mon=0..Sun=6
    days.push({ date: d, dayOfWeek });
  }
  return days;
}

function formatDateStr(year: number, month: number, date: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
}

function outcomeIcon(result: DailyResult): string {
  if (result.outcome === 'won' || result.outcome === 'complete') return '✓';
  return '✗';
}

interface DayDetailProps {
  dateStr: string;
  dayResults: DayResults;
}

function DayDetail({ dateStr, dayResults }: DayDetailProps) {
  const games = ALL_GAMES.filter((g) => dayResults[g] != null);
  const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('de-CH', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="mt-3 rounded-lg border-2 border-[var(--color-gray-bg)] p-3 animate-[resultSlideUp_300ms_ease-out]">
      <p className="text-xs font-semibold text-[var(--color-gray-text)] mb-2">
        {dateLabel}
      </p>
      <div className="flex flex-col gap-1.5">
        {games.map((g) => {
          const result = dayResults[g]!;
          const meta = GAME_META[g];
          const isWin = result.outcome === 'won' || result.outcome === 'complete';
          return (
            <div key={g} className="flex items-center gap-2">
              <span className="text-base" aria-hidden>{meta.emoji}</span>
              <span className="flex-1 text-sm font-semibold">{meta.name}</span>
              <span className="text-xs text-[var(--color-gray-text)]">
                {result.summary}
              </span>
              <span
                className={`text-xs font-bold ${isWin ? 'text-[var(--color-green)]' : 'text-[var(--color-pink)]'}`}
              >
                {outcomeIcon(result)}
              </span>
            </div>
          );
        })}
      </div>
      {games.length === 3 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-[var(--color-pink)] font-semibold">
          <span>🎯</span>
          <span>Tages-Sweep!</span>
        </div>
      )}
    </div>
  );
}

export function PlayCalendar() {
  const history = useMemo(() => getPlayHistory(), []);
  const today = getToday();

  const [viewYear, setViewYear] = useState(() =>
    parseInt(today.split('-')[0], 10),
  );
  const [viewMonth, setViewMonth] = useState(() =>
    parseInt(today.split('-')[1], 10) - 1,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = getMonthDays(viewYear, viewMonth);
  const firstDayOffset = days[0]?.dayOfWeek ?? 0;

  // Count stats for the viewed month
  const monthStats = useMemo(() => {
    const monthDays = getMonthDays(viewYear, viewMonth);
    let daysPlayed = 0;
    let sweeps = 0;
    for (const { date } of monthDays) {
      const dateStr = formatDateStr(viewYear, viewMonth, date);
      const dayData = history[dateStr];
      if (dayData && Object.keys(dayData).length > 0) {
        daysPlayed++;
        if (Object.keys(dayData).length === 3) sweeps++;
      }
    }
    return { daysPlayed, sweeps };
  }, [history, viewYear, viewMonth]);

  // Navigation bounds: only go back if there's history, don't go past current month
  const todayYear = parseInt(today.split('-')[0], 10);
  const todayMonth = parseInt(today.split('-')[1], 10) - 1;

  const historyDates = Object.keys(history).sort();
  const earliestDate = historyDates[0];

  const canGoPrev = earliestDate
    ? viewYear > parseInt(earliestDate.split('-')[0], 10) ||
      (viewYear === parseInt(earliestDate.split('-')[0], 10) &&
        viewMonth > parseInt(earliestDate.split('-')[1], 10) - 1)
    : false;

  const canGoNext = viewYear < todayYear ||
    (viewYear === todayYear && viewMonth < todayMonth);

  function navigateMonth(delta: number) {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth < 0) { newMonth = 11; newYear -= 1; }
    if (newMonth > 11) { newMonth = 0; newYear += 1; }
    setViewMonth(newMonth);
    setViewYear(newYear);
    setSelectedDate(null);
  }

  const selectedDayResults = selectedDate ? history[selectedDate] : null;

  return (
    <div>
      <h2 className="mb-3 font-[family-name:var(--font-heading)] text-lg font-bold">
        Spielverlauf
      </h2>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigateMonth(-1)}
          disabled={!canGoPrev}
          className={`rounded p-1.5 text-sm font-semibold transition-colors ${
            canGoPrev
              ? 'text-[var(--color-black)] hover:bg-[var(--color-gray-bg)] cursor-pointer'
              : 'text-[var(--color-gray-text)]/30 cursor-default'
          }`}
          aria-label="Vorheriger Monat"
        >
          ←
        </button>
        <span className="text-sm font-bold">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={() => navigateMonth(1)}
          disabled={!canGoNext}
          className={`rounded p-1.5 text-sm font-semibold transition-colors ${
            canGoNext
              ? 'text-[var(--color-black)] hover:bg-[var(--color-gray-bg)] cursor-pointer'
              : 'text-[var(--color-gray-text)]/30 cursor-default'
          }`}
          aria-label="Nächster Monat"
        >
          →
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-[var(--color-gray-text)] py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty offset cells */}
        {Array.from({ length: firstDayOffset }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map(({ date }) => {
          const dateStr = formatDateStr(viewYear, viewMonth, date);
          const dayData = history[dateStr];
          const gamesPlayed = dayData ? Object.keys(dayData) as GameType[] : [];
          const hasPlayed = gamesPlayed.length > 0;
          const isToday = dateStr === today;
          const isFuture = dateStr > today;
          const isSelected = selectedDate === dateStr;
          const isSweep = gamesPlayed.length === 3;

          return (
            <button
              key={date}
              onClick={() => hasPlayed && setSelectedDate(isSelected ? null : dateStr)}
              disabled={!hasPlayed}
              className={`
                relative flex h-10 w-full flex-col items-center justify-center rounded-md text-xs transition-all
                ${isSelected
                  ? 'bg-[var(--color-cyan)] text-white font-bold'
                  : isToday
                    ? 'ring-2 ring-[var(--color-cyan)] font-bold text-[var(--color-black)]'
                    : hasPlayed
                      ? 'bg-[var(--color-gray-bg)] font-medium text-[var(--color-black)] hover:bg-[var(--color-cyan)]/20 cursor-pointer'
                      : isFuture
                        ? 'text-[var(--color-gray-text)]/20 cursor-default'
                        : 'text-[var(--color-gray-text)]/40 cursor-default'
                }
              `}
              aria-label={
                hasPlayed
                  ? `${date}. ${MONTH_NAMES[viewMonth]} — ${gamesPlayed.length} ${gamesPlayed.length === 1 ? 'Spiel' : 'Spiele'}`
                  : `${date}. ${MONTH_NAMES[viewMonth]}`
              }
            >
              <span className="leading-none">{date}</span>
              {/* Game dots */}
              {hasPlayed && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-[3px]">
                  {isSweep ? (
                    <span
                      className="block h-1.5 w-1.5 rounded-full bg-[var(--color-pink)]"
                      aria-label="Tages-Sweep"
                    />
                  ) : (
                    gamesPlayed.map((g) => (
                      <span
                        key={g}
                        className="block h-1 w-1 rounded-full"
                        style={{ backgroundColor: GAME_META[g].color }}
                      />
                    ))
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Month stats */}
      {monthStats.daysPlayed > 0 && (
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-[var(--color-gray-text)]">
          <span>
            <span className="font-semibold text-[var(--color-black)]">{monthStats.daysPlayed}</span>
            {' '}{monthStats.daysPlayed === 1 ? 'Tag' : 'Tage'} gespielt
          </span>
          {monthStats.sweeps > 0 && (
            <span>
              <span className="font-semibold text-[var(--color-pink)]">{monthStats.sweeps}</span>
              {' '}🎯 {monthStats.sweeps === 1 ? 'Sweep' : 'Sweeps'}
            </span>
          )}
        </div>
      )}

      {/* Selected day detail */}
      {selectedDate && selectedDayResults && Object.keys(selectedDayResults).length > 0 && (
        <DayDetail dateStr={selectedDate} dayResults={selectedDayResults} />
      )}

      {/* Empty state */}
      {Object.keys(history).length === 0 && (
        <p className="mt-4 text-center text-xs text-[var(--color-gray-text)]">
          Spiele ein Rätsel und dein Verlauf erscheint hier.
        </p>
      )}
    </div>
  );
}
