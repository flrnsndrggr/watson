import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { useQuizzticle } from './useQuizzticle';
import { QuizzticleResult } from './QuizzticleResult';

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function QuizzticlePage() {
  const [params] = useSearchParams();
  const archiveDate = params.get('date') ?? undefined;
  const {
    puzzle,
    filled,
    filledDisplay,
    timeRemaining,
    status,
    loadPuzzle,
    tryMatch,
    tickSecond,
    finish,
  } = useQuizzticle();

  const [input, setInput] = useState('');
  const [flash, setFlash] = useState<'correct' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadPuzzle(archiveDate);
  }, [loadPuzzle, archiveDate]);

  // Tick the timer once per second while playing
  useEffect(() => {
    if (status !== 'playing') return;
    const t = setInterval(tickSecond, 1000);
    return () => clearInterval(t);
  }, [status, tickSecond]);

  // Auto-snap matcher: every keystroke, try to match. Clear input on success.
  useEffect(() => {
    if (status !== 'playing') return;
    if (!input.trim()) return;
    const matched = tryMatch(input);
    if (matched !== null) {
      setInput('');
      setFlash('correct');
      setTimeout(() => setFlash(null), 250);
    }
  }, [input, tryMatch, status]);

  if (!puzzle || status === 'loading') {
    return (
      <GameShell>
        <div className="mt-12 text-center text-sm text-[var(--color-gray-text)]">Lade …</div>
      </GameShell>
    );
  }

  if (status === 'finished') {
    return (
      <GameShell>
        <QuizzticleResult />
      </GameShell>
    );
  }

  const filledCount = filled.filter(Boolean).length;
  const lowTime = timeRemaining <= 60;

  return (
    <GameShell>
      <GameHeader
        title="Quizzticle"
        puzzleId={String(puzzle.episode)}
        subtitle={puzzle.prompt}
      />

      {/* HUD */}
      <div className="mb-3 flex items-center justify-between rounded-lg border-2 border-[var(--color-gray-bg)] bg-[var(--color-surface-soft,var(--color-gray-bg))] px-3 py-2">
        <span className="text-sm font-bold tabular-nums">
          <span className="text-[var(--color-cyan)]">{filledCount}</span>
          <span className="text-[var(--color-gray-text)]">/{puzzle.items.length}</span>
        </span>
        <span
          className={`font-[family-name:var(--font-heading)] text-lg font-black tabular-nums ${
            lowTime ? 'text-[var(--color-pink)] animate-pulse' : 'text-[var(--color-black)]'
          }`}
          aria-label={`Restzeit ${fmtTime(timeRemaining)}`}
        >
          {fmtTime(timeRemaining)}
        </span>
        <button
          type="button"
          onClick={finish}
          className="rounded border border-[var(--color-gray-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-gray-text)] transition-colors hover:bg-[var(--color-gray-bg)]"
        >
          Aufgeben
        </button>
      </div>

      {/* Input — auto-snaps when match */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Tippe los — Treffer rasten automatisch ein"
        className={`mb-3 w-full min-h-[44px] rounded-lg border-2 px-3 text-sm transition-colors focus:outline-none ${
          flash === 'correct'
            ? 'border-[var(--color-green)] bg-[var(--color-green)]/[0.08]'
            : 'border-[var(--color-gray-bg)] focus:border-[var(--color-cyan)]'
        }`}
      />

      {/* Slot grid */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {puzzle.items.map((_, i) => {
          const done = filled[i];
          return (
            <div
              key={i}
              className={`min-h-[36px] rounded px-2 py-1 text-xs leading-tight ${
                done
                  ? 'bg-[var(--color-green)]/[0.10] text-[var(--color-black)] font-semibold border border-[var(--color-green)]/30'
                  : 'bg-[var(--color-gray-bg)] text-[var(--color-gray-text)] border border-transparent'
              }`}
            >
              {done ? filledDisplay[i] : '—'}
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}
