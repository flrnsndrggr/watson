import { useEffect } from 'react';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { ShareButton } from '@/components/shared/ShareButton';
import { PostGameSection } from '@/components/shared/PostGameSection';
import { showToast } from '@/components/shared/Toast';
import { generateShareText } from '@/lib/share';
import { RankBar } from '@/games/buchstaebli/RankBar';
import { EmojiPool } from './EmojiPool';
import { CombineSlots } from './CombineSlots';
import { useZaemesetzli } from './useZaemesetzli';
import confetti from 'canvas-confetti';

const RESULT_MESSAGES: Record<string, string> = {
  'valid': '',
  'mundart': 'Mundart-Bonus! 🇨🇭',
  'not-in-puzzle': "Gutes Wort, aber nicht in der heutigen Lösung!",
  'invalid': 'Kein gültiges Wort',
  'already-found': 'Schon gefunden!',
  'wrong-emojis': 'Stimmt, aber andere Emojis!',
};

const RANK_UP_MESSAGES: Record<string, string> = {
  lehrling: 'Aufstieg: Lehrling!',
  geselle: 'Aufstieg: Geselle!',
  meister: 'Aufstieg: Meister!',
  bundesrat: 'Bundesrat erreicht!',
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
    lastRankUp,
    lastResult,
    selectEmoji,
    clearEmojiSelection,
    setInput,
    submitWord,
    useHint,
    clearLastResult,
    clearRankUp,
  } = useZaemesetzli();

  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  useEffect(() => {
    if (!lastResult) return;
    const msg = RESULT_MESSAGES[lastResult];
    if (msg) showToast(msg);
    const timer = setTimeout(clearLastResult, 2000);
    return () => clearTimeout(timer);
  }, [lastResult, clearLastResult]);

  // Rank-up celebration
  useEffect(() => {
    if (!lastRankUp) return;
    const msg = RANK_UP_MESSAGES[lastRankUp];
    if (msg) {
      const timer = setTimeout(() => showToast(msg), 400);
      if (lastRankUp === 'bundesrat') {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      }
      const cleanup = setTimeout(clearRankUp, 2500);
      return () => { clearTimeout(timer); clearTimeout(cleanup); };
    }
    clearRankUp();
  }, [lastRankUp, clearRankUp]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitWord();
  }

  function handleHint() {
    const hint = useHint();
    if (hint) showToast(`Tipp: ${hint}`);
    else showToast('Alle Wörter gefunden!');
  }

  if (!puzzle) return null;

  const shareText = generateShareText(
    'zaemesetzli',
    1,
    `${foundWords.length}/${puzzle.valid_compounds.length} gefunden · ${score} Pkt · ${currentRank.charAt(0).toUpperCase() + currentRank.slice(1)}`,
  );

  return (
    <GameShell>
      <GameHeader title="Zämesetzli" puzzleNumber={1} subtitle="Kombiniere Emojis zu deutschen Wörtern" />

      <RankBar
        currentRank={currentRank}
        score={score}
        maxScore={puzzle.max_score}
        thresholds={puzzle.rank_thresholds}
        rankUpRank={lastRankUp}
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
      <form onSubmit={handleSubmit} className="mx-auto mt-2 flex max-w-[360px] gap-2">
        <input
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
            {foundWords.map((fw) => (
              <div
                key={fw.word}
                className={`flex items-center justify-between rounded px-3 py-1.5 text-sm ${
                  fw.is_mundart
                    ? 'bg-[var(--color-green)]/10 text-[var(--color-black)]'
                    : 'bg-[var(--color-gray-bg)] text-[var(--color-black)]'
                }`}
              >
                <span>
                  {fw.components.join('')}{' '}
                  <span className="font-semibold">{fw.word}</span>
                  {fw.is_mundart && <span className="ml-1">🇨🇭</span>}
                </span>
                <span className="text-xs text-[var(--color-gray-text)]">{fw.points}pt</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share */}
      <div className="mt-6 text-center">
        <ShareButton text={shareText} />
      </div>

      <PostGameSection currentGame="zaemesetzli" />
    </GameShell>
  );
}
