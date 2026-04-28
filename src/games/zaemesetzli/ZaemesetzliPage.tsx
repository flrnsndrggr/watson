import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
import type { Rank } from '@/types';

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
    foundWords,
    hintsUsed,
    score,
    currentRank,
    lastResult,
    lastResultId,
    lastFoundCompound,
    lastExtraFound,
    status,
    isArchive,
    selectEmoji,
    deselectEmoji,
    clearEmojiSelection,
    submitCombination,
    finishGame,
    useHint,
    clearLastResult,
  } = useZaemesetzli();

  const { current: streakCount, recordPlay } = useStreak('zaemesetzli');
  const { isStale, refresh } = useDailyReset(puzzle?.date ?? null, loadPuzzle);
  const [shaking, setShaking] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const prevRank = useRef<Rank>(currentRank);

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

    const isError = lastResult === 'invalid' || lastResult === 'already-found';

    if (isError) {
      setShaking(true);
      setRejected(true);
      const shakeTimer = setTimeout(() => setShaking(false), 400);
      const bounceTimer = setTimeout(() => {
        setRejected(false);
        clearEmojiSelection();
      }, 400);

      if (lastResult === 'invalid') showToast('Keine Kombination gefunden');
      else if (lastResult === 'already-found') showToast('Schon gefunden!');

      const clearTimer = setTimeout(clearLastResult, 2000);
      return () => { clearTimeout(shakeTimer); clearTimeout(bounceTimer); clearTimeout(clearTimer); };
    }

    if (lastResult === 'mundart') {
      showToast('Mundart-Bonus! 🇨🇭');
    }

    // Toast extra compounds awarded on the same submission (e.g. ⛰️+🧀 yields
    // both Bergkäse and Alpkäse). The primary one runs the celebrate animation.
    for (const extra of lastExtraFound) {
      showToast(`Auch: ${extra.word}${extra.is_mundart ? ' 🇨🇭' : ''} +${extra.points}`);
    }

    const timer = setTimeout(clearLastResult, 2000);
    return () => clearTimeout(timer);
  }, [lastResult, lastResultId, lastExtraFound, clearLastResult, clearEmojiSelection]);

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

  // Keyboard support: Enter submits, Backspace clears the emoji selection.
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (status !== 'playing') return;
    const isFormField = e.target instanceof HTMLInputElement
      || e.target instanceof HTMLTextAreaElement
      || (e.target instanceof HTMLElement && e.target.isContentEditable);
    if (isFormField) return;

    if (e.key === 'Enter' && selectedEmojis.length >= 2) {
      e.preventDefault();
      submitCombination();
    } else if (e.key === 'Backspace' && selectedEmojis.length > 0) {
      e.preventDefault();
      deselectEmoji(selectedEmojis[selectedEmojis.length - 1]);
    }
  }, [status, selectedEmojis, deselectEmoji, submitCombination]);

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

  function handleHint() {
    const hint = useHint();
    if (hint) showToast(`Tipp: ${hint}`);
    else showToast('Alle Wörter gefunden!');
  }

  // After the first hint, compute which emojis still appear in unfound compounds.
  // Productive emojis glow to guide the player; exhausted ones dim.
  const productiveEmojis = useMemo(() => {
    if (!puzzle || hintsUsed === 0) return undefined;
    const foundWordSet = new Set(foundWords.map((fw) => fw.word.toLowerCase()));
    const unfound = puzzle.valid_compounds.filter(
      (c) => !foundWordSet.has(c.word.toLowerCase()),
    );
    const emojis = new Set<string>();
    for (const compound of unfound) {
      for (const emoji of compound.components) {
        emojis.add(emoji);
      }
    }
    return emojis;
  }, [puzzle, foundWords, hintsUsed]);

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
          {/* Emoji pool */}
          <EmojiPool
            emojis={puzzle.emojis}
            selectedEmojis={selectedEmojis}
            hintableEmojis={productiveEmojis}
            onSelect={selectEmoji}
          />

          {/* Combine slots */}
          <CombineSlots
            selectedEmojis={selectedEmojis}
            onClear={clearEmojiSelection}
            onRemove={deselectEmoji}
            onDrop={selectEmoji}
            celebration={lastFoundCompound}
            rejected={rejected}
          />

          {/* Submit + hint */}
          <div
            className={`mx-auto mt-2 flex max-w-[360px] flex-col items-center gap-3 transition-colors ${
              shaking ? 'animate-[shake_400ms_ease]' : ''
            }`}
          >
            <button
              type="button"
              onClick={submitCombination}
              disabled={selectedEmojis.length < 2}
              aria-label={
                selectedEmojis.length < 2
                  ? 'Wähle zuerst 2–3 Emojis'
                  : 'Kombination prüfen'
              }
              className={`min-h-[44px] w-full rounded px-5 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:bg-[var(--color-gray-bg)] disabled:text-[var(--color-gray-text)] ${
                lastResult === 'valid' || lastResult === 'mundart'
                  ? 'bg-[var(--color-green)] ring-2 ring-[var(--color-green)]'
                  : 'bg-[var(--color-cyan)] hover:opacity-85'
              }`}
            >
              {selectedEmojis.length < 2 ? 'Wähle 2–3 Emojis' : 'Prüfen'}
            </button>

            <button
              type="button"
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
                      <span>
                        {fw.components.join('')}{' '}
                        <span className="font-semibold">{fw.word}</span>
                        {fw.is_mundart && <span className="ml-1">🇨🇭</span>}
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
