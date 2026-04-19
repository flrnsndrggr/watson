import { useEffect, useState, useRef } from 'react';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { ShareButton } from '@/components/shared/ShareButton';
import { PostGameSection } from '@/components/shared/PostGameSection';
import { PuzzleLoading } from '@/components/shared/PuzzleLoading';
import { NewPuzzleBanner } from '@/components/shared/NewPuzzleBanner';
import { HowToPlayModal } from '@/components/shared/HowToPlayModal';
import { hasSeenHowToPlay } from '@/lib/howToPlayStorage';
import { ZAEMESETZLI_STEPS } from '@/lib/howToPlayContent';
import { showToast } from '@/components/shared/Toast';
import { generateShareText } from '@/lib/share';
import { StreakBadge } from '@/components/shared/StreakBadge';
import { StreakPrompt } from '@/components/shared/StreakPrompt';
import { useDailyReset } from '@/lib/useDailyReset';
import { RankBar } from '@/games/buchstaebli/RankBar';
import { EmojiPool } from './EmojiPool';
import { CombineSlots } from './CombineSlots';
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
  const {
    loadPuzzle,
    puzzle,
    selectedEmojis,
    currentInput,
    foundWords,
    score,
    currentRank,
    lastResult,
    streak,
    selectEmoji,
    clearEmojiSelection,
    setInput,
    submitWord,
    useHint,
    clearLastResult,
  } = useZaemesetzli();

  const { isStale, refresh } = useDailyReset(puzzle?.date ?? null, loadPuzzle);
  const [shaking, setShaking] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const prevRank = useRef<Rank>(currentRank);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPuzzle();
    if (!hasSeenHowToPlay('zaemesetzli')) {
      setShowHowToPlay(true);
    }
  }, [loadPuzzle]);

  // Handle guess results: shake on wrong, celebrate on correct
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
  }, [lastResult, clearLastResult]);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitWord();
  }

  function handleHint() {
    const hint = useHint();
    if (hint) showToast(`Tipp: ${hint}`);
    else showToast('Alle Wörter gefunden!');
  }

  if (!puzzle) return <PuzzleLoading />;

  const shareText = generateShareText(
    'zaemesetzli',
    puzzle.date,
    `${foundWords.length}/${puzzle.valid_compounds.length} gefunden · ${score} Pkt · ${currentRank.charAt(0).toUpperCase() + currentRank.slice(1)}`,
  );

  return (
    <GameShell>
      {isStale && <NewPuzzleBanner onRefresh={refresh} />}
      <GameHeader title="Zämesetzli" puzzleNumber={1} subtitle="Kombiniere Emojis zu deutschen Wörtern" onInfoClick={() => setShowHowToPlay(true)} />

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

      {/* Streak + Share */}
      <div className="mt-6 flex flex-col items-center gap-3">
        {streak.current >= 1 && <StreakBadge streak={streak} />}
        <StreakPrompt streak={streak} />
        <ShareButton text={shareText} />
      </div>

      <PostGameSection currentGame="zaemesetzli" />
    </GameShell>
  );
}
