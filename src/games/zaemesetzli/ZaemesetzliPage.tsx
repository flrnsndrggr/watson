import { useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { AdSlot } from '@/components/shared/AdSlot';
import { PuzzleLoading } from '@/components/shared/PuzzleLoading';
import { NewPuzzleBanner } from '@/components/shared/NewPuzzleBanner';
import { ArchiveBanner } from '@/components/shared/ArchiveBanner';
import { HowToPlayModal } from '@/components/shared/HowToPlayModal';
import { hasSeenHowToPlay } from '@/lib/howToPlayStorage';
import { ZAEMESETZLI_STEPS } from '@/lib/howToPlayContent';
import { showToast } from '@/components/shared/Toast';
import { useDailyReset } from '@/lib/useDailyReset';
import { useStreak } from '@/lib/useStreak';
import { RankBar } from '@/components/shared/RankBar';
import { EmojiPool } from './EmojiPool';
import { CombineSlots } from './CombineSlots';
import { ZaemesetzliResult } from './ZaemesetzliResult';
import { useZaemesetzli } from './useZaemesetzli';
import type { Rank, CompoundWord } from '@/types';

const DIFFICULTY_COLORS: Record<1 | 2 | 3, string> = {
  1: 'var(--color-difficulty-1)',
  2: 'var(--color-difficulty-2)',
  3: 'var(--color-difficulty-3)',
};

const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Einfach',
  2: 'Mittel',
  3: 'Schwer',
};

function DifficultyProgress({
  foundWords,
  validCompounds,
}: {
  foundWords: { difficulty: 1 | 2 | 3 }[];
  validCompounds: CompoundWord[];
}) {
  const tiers = [1, 2, 3] as const;

  return (
    <div className="flex gap-2 px-1 pb-2" role="group" aria-label="Fortschritt nach Schwierigkeit">
      {tiers.map((d) => {
        const total = validCompounds.filter((c) => c.difficulty === d).length;
        if (total === 0) return null;
        const found = foundWords.filter((fw) => fw.difficulty === d).length;
        const pct = Math.round((found / total) * 100);
        return (
          <div key={d} className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center justify-between">
              <span className="flex items-center gap-0.5 text-[10px] font-semibold">
                <span style={{ color: DIFFICULTY_COLORS[d] }} aria-hidden="true">
                  {'●'.repeat(d)}
                </span>
                <span className="text-[var(--color-gray-text)]">{DIFFICULTY_LABELS[d]}</span>
              </span>
              <span className="text-[10px] font-semibold text-[var(--color-gray-text)]">
                {found}/{total}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-gray-bg)]">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%`, backgroundColor: DIFFICULTY_COLORS[d] }}
                role="progressbar"
                aria-valuenow={found}
                aria-valuemax={total}
                aria-label={`${DIFFICULTY_LABELS[d]}: ${found} von ${total}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const RANK_LABELS: Record<Rank, string> = {
  stift: 'Stift',
  lehrling: 'Lehrling',
  geselle: 'Geselle',
  meister: 'Meister',
  bundesrat: 'Bundesrat',
};

export function ZaemesetzliPage() {
  const [searchParams] = useSearchParams();
  const archiveDate = searchParams.get('date');

  const {
    loadPuzzle,
    puzzle,
    selectedEmojis,
    currentInput,
    foundWords,
    score,
    currentRank,
    lastResult,
    lastResultId,
    lastFoundCompound,
    status,
    isArchive,
    selectEmoji,
    clearEmojiSelection,
    setInput,
    submitWord,
    finishGame,
    useHint,
    clearLastResult,
  } = useZaemesetzli();

  const { current: streakCount, recordPlay } = useStreak('zaemesetzli');
  const { isStale, refresh } = useDailyReset(puzzle?.date ?? null, loadPuzzle);
  const [shaking, setShaking] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const prevRank = useRef<Rank>(currentRank);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPuzzle(archiveDate ?? undefined);
    if (!hasSeenHowToPlay('zaemesetzli')) {
      setShowHowToPlay(true);
    }
  }, [loadPuzzle, archiveDate]);

  // Handle guess results: shake on wrong, celebrate on correct
  useEffect(() => {
    if (foundWords.length > 0 && puzzle?.date) {
      recordPlay(puzzle.date);
    }
  }, [foundWords.length, puzzle?.date, recordPlay]);

  useEffect(() => {
    if (!lastResult) return;

    const isError = lastResult === 'invalid' || lastResult === 'already-found'
      || lastResult === 'wrong-emojis' || lastResult === 'not-in-puzzle';

    if (isError) {
      setShaking(true);
      const shakeTimer = setTimeout(() => setShaking(false), 400);

      if (lastResult === 'invalid') showToast('Kein gültiges Wort');
      else if (lastResult === 'already-found') showToast('Schon gefunden!');
      else if (lastResult === 'wrong-emojis') showToast('Stimmt, aber andere Emojis!');
      else if (lastResult === 'not-in-puzzle') showToast('Gutes Wort, aber nicht in der heutigen Lösung!');

      // Re-focus input for quick retry
      inputRef.current?.focus();

      const clearTimer = setTimeout(clearLastResult, 2000);
      return () => { clearTimeout(shakeTimer); clearTimeout(clearTimer); };
    }

    if (lastResult === 'mundart') {
      showToast('Mundart-Bonus! 🇨🇭 +1');
    }

    const timer = setTimeout(clearLastResult, 2000);
    return () => clearTimeout(timer);
  }, [lastResult, lastResultId, clearLastResult]);

  // Confetti + toast on rank milestones
  useEffect(() => {
    if (currentRank !== prevRank.current) {
      const prev = prevRank.current;
      prevRank.current = currentRank;

      // Only celebrate rank-ups, not initial load
      if (prev === 'stift' && currentRank === 'lehrling') {
        showToast(`Aufgestiegen: ${RANK_LABELS[currentRank]}!`);
      } else if (currentRank === 'geselle' || currentRank === 'meister' || currentRank === 'bundesrat') {
        showToast(`🎉 ${RANK_LABELS[currentRank]} erreicht!`);

        if (currentRank === 'meister' || currentRank === 'bundesrat') {
          import('canvas-confetti').then(({ default: confetti }) => {
            confetti({
              particleCount: currentRank === 'bundesrat' ? 150 : 100,
              spread: currentRank === 'bundesrat' ? 100 : 70,
              origin: { y: 0.6 },
            });
          });
        }
      }
    }
  }, [currentRank]);

  // Keyboard support: Backspace clears emoji selection when input is empty
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (status !== 'playing') return;
    if (e.key === 'Backspace' && !currentInput && selectedEmojis.length > 0) {
      clearEmojiSelection();
    }
  }, [status, currentInput, selectedEmojis.length, clearEmojiSelection]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Confetti on game completion (all compounds found) or finishing with high rank
  useEffect(() => {
    if (status === 'complete') {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      });
    } else if (status === 'finished' && (currentRank === 'meister' || currentRank === 'bundesrat')) {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      });
    }
  }, [status, currentRank]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitWord();
  }

  function handleHint() {
    const hint = useHint();
    if (hint) showToast(`Tipp: ${hint}`);
    else showToast('Alle Wörter gefunden!');
  }

  if (!puzzle) return <PuzzleLoading variant="zaemesetzli" />;

  return (
    <GameShell>
      {isArchive && <ArchiveBanner date={puzzle?.date ?? archiveDate ?? ''} />}
      {!isArchive && isStale && <NewPuzzleBanner onRefresh={refresh} />}
      <GameHeader
        title="Zämesetzli"
        puzzleId={puzzle?.date ?? ''}
        subtitle="Kombiniere Emojis zu deutschen Wörtern"
        onInfoClick={() => setShowHowToPlay(true)}
        streak={streakCount}
      />

      {showHowToPlay && (
        <HowToPlayModal
          gameId="zaemesetzli"
          title="Zämesetzli"
          steps={ZAEMESETZLI_STEPS}
          onClose={() => setShowHowToPlay(false)}
        />
      )}

      <RankBar
        currentRank={currentRank}
        score={score}
        maxScore={puzzle.max_score}
        thresholds={puzzle.rank_thresholds}
      />

      {status === 'playing' ? (
        <>
          {/* Difficulty progress bars */}
          {puzzle && (
            <DifficultyProgress
              foundWords={foundWords}
              validCompounds={puzzle.valid_compounds}
            />
          )}

          {/* Emoji pool */}
          <EmojiPool
            emojis={puzzle.emojis}
            selectedEmojis={selectedEmojis}
            onSelect={selectEmoji}
          />

          {/* Combine slots */}
          <CombineSlots
            selectedEmojis={selectedEmojis}
            onClear={clearEmojiSelection}
            onDrop={selectEmoji}
            celebration={lastFoundCompound}
          />

          {/* Word input */}
          <form
            onSubmit={handleSubmit}
            className={`mx-auto mt-2 flex max-w-[360px] gap-2 transition-colors ${
              shaking ? 'animate-[shake_400ms_ease]' : ''
            } ${
              lastResult === 'valid' || lastResult === 'mundart'
                ? 'rounded ring-2 ring-[var(--color-green)]'
                : ''
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setInput(e.target.value)}
              disabled={selectedEmojis.length < 2}
              placeholder={selectedEmojis.length < 2 ? 'Wähle 2-3 Emojis...' : 'Zusammengesetztes Wort...'}
              className="flex-1 rounded border-2 border-[var(--color-gray-bg)] px-3 py-2 text-sm font-semibold outline-none transition-colors focus:border-[var(--color-cyan)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={selectedEmojis.length < 2 || !currentInput.trim()}
              aria-label="Wort absenden"
              className="rounded bg-[var(--color-cyan)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              &rarr;
            </button>
          </form>

          {/* Hint button */}
          <div className="mt-3 text-center">
            <button
              onClick={handleHint}
              className="text-xs text-[var(--color-gray-text)] underline hover:text-[var(--color-cyan)]"
            >
              💡 Tipp (-1 Pkt)
            </button>
          </div>

          {/* Found words */}
          {foundWords.length > 0 && (
            <div className="mt-5">
              <p className="text-sm text-[var(--color-gray-text)]">
                Gefunden ({foundWords.length}/{puzzle.valid_compounds.length}):
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                {foundWords.map((fw, i) => {
                  const isNewest = i === foundWords.length - 1 && lastResult !== null;
                  return (
                    <div
                      key={fw.word}
                      className={`flex items-center justify-between rounded px-3 py-1.5 text-sm ${
                        fw.is_mundart
                          ? 'bg-[var(--color-green)]/10 text-[var(--color-black)]'
                          : 'bg-[var(--color-gray-bg)] text-[var(--color-black)]'
                      } ${isNewest ? 'animate-[popIn_300ms_ease]' : ''}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: DIFFICULTY_COLORS[fw.difficulty] }}
                          aria-label={DIFFICULTY_LABELS[fw.difficulty]}
                        />
                        {fw.components.join('')}{' '}
                        <span className="font-semibold">{fw.word}</span>
                        {fw.is_mundart && <span className="ml-0.5">🇨🇭</span>}
                      </span>
                      <span className="text-xs text-[var(--color-gray-text)]">
                        {fw.is_mundart && isNewest ? '🇨🇭 ' : ''}{fw.points}pt
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Finish button — appears after finding at least 1 word */}
          {foundWords.length > 0 && (
            <div className="mt-6 flex justify-center animate-[resultSlideUp_300ms_ease-out]">
              <button
                onClick={finishGame}
                className="rounded border-2 border-[var(--color-gray-bg)] px-5 py-2.5 text-sm font-semibold text-[var(--color-gray-text)] transition-all hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
              >
                Ich bi fertig
              </button>
            </div>
          )}
        </>
      ) : (
        <ZaemesetzliResult />
      )}

      <div className="mt-6 flex justify-center">
        <AdSlot type="mrec" />
      </div>
    </GameShell>
  );
}
