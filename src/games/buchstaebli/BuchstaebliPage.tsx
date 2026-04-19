import { useState, useEffect, useCallback, useRef } from 'react';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { PuzzleLoading } from '@/components/shared/PuzzleLoading';
import { NewPuzzleBanner } from '@/components/shared/NewPuzzleBanner';
import { HowToPlayModal } from '@/components/shared/HowToPlayModal';
import { hasSeenHowToPlay } from '@/lib/howToPlayStorage';
import { BUCHSTAEBLI_STEPS } from '@/lib/howToPlayContent';
import { showToast } from '@/components/shared/Toast';
import { ShareButton } from '@/components/shared/ShareButton';
import { generateShareText } from '@/lib/share';
import { useDailyReset } from '@/lib/useDailyReset';
import type { Rank } from '@/types';
import { HexGrid } from './HexGrid';
import { RankBar } from './RankBar';
import { useBuchstaebli } from './useBuchstaebli';

const RESULT_MESSAGES: Record<string, string> = {
  'too-short': 'Mindestens 4 Buchstaben',
  'missing-center': '',
  'already-found': 'Schon gefunden!',
  'not-valid': 'Nicht im Wörterbuch',
  'valid': '',
  'pangram': 'Pangram! +7 Bonus!',
  'mundart': 'Mundart-Bonus! 2× Punkte 🇨🇭',
};

const RANK_LABELS: Record<Rank, string> = {
  stift: 'Stift',
  lehrling: 'Lehrling',
  geselle: 'Geselle',
  meister: 'Meister',
  bundesrat: 'Bundesrat',
};

const ERROR_RESULTS = new Set(['too-short', 'missing-center', 'already-found', 'not-valid']);
const SUCCESS_RESULTS = new Set(['valid', 'pangram', 'mundart']);

export function BuchstaebliPage() {
  const {
    loadPuzzle,
    puzzle,
    currentInput,
    foundWords,
    score,
    currentRank,
    outerLetters,
    lastResult,
    addLetter,
    deleteLetter,
    clearInput,
    shuffleLetters,
    submitWord,
    clearLastResult,
  } = useBuchstaebli();

  const { isStale, refresh } = useDailyReset(puzzle?.date ?? null, loadPuzzle);

  const [shufflePhase, setShufflePhase] = useState<'out' | 'in' | null>(null);
  const shuffleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [inputFlash, setInputFlash] = useState<'success' | 'error' | null>(null);
  const prevRank = useRef<Rank>(currentRank);
  const [newestWord, setNewestWord] = useState<string | null>(null);

  useEffect(() => {
    loadPuzzle();
    if (!hasSeenHowToPlay('buchstaebli')) {
      setShowHowToPlay(true);
    }
  }, [loadPuzzle]);

  // Toast + input feedback on guess result
  useEffect(() => {
    if (!lastResult) return;

    // Toast message
    if (lastResult === 'missing-center' && puzzle) {
      showToast(`Der Buchstabe ${puzzle.center_letter} muss dabei sein`);
    } else if (RESULT_MESSAGES[lastResult]) {
      showToast(RESULT_MESSAGES[lastResult]);
    }

    // Input field shake + color flash on errors
    if (ERROR_RESULTS.has(lastResult)) {
      setShaking(true);
      setInputFlash('error');
      setTimeout(() => setShaking(false), 400);
      setTimeout(() => setInputFlash(null), 600);
    }

    // Input field green flash on success
    if (SUCCESS_RESULTS.has(lastResult)) {
      setInputFlash('success');
      setTimeout(() => setInputFlash(null), 600);
    }

    // Confetti on pangram
    if (lastResult === 'pangram') {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      });
    }

    // Track newest word for pop-in animation
    if (SUCCESS_RESULTS.has(lastResult) && foundWords.length > 0) {
      const latest = foundWords[foundWords.length - 1].word;
      setNewestWord(latest);
      setTimeout(() => setNewestWord(null), 400);
    }

    const timer = setTimeout(clearLastResult, 2000);
    return () => clearTimeout(timer);
  }, [lastResult, puzzle, clearLastResult, foundWords]);

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

  // Animated shuffle: out → swap letters → in
  const handleShuffle = useCallback(() => {
    if (shufflePhase) return; // prevent double-clicks during animation
    setShufflePhase('out');
    shuffleTimerRef.current = setTimeout(() => {
      shuffleLetters();
      setShufflePhase('in');
      shuffleTimerRef.current = setTimeout(() => {
        setShufflePhase(null);
      }, 380); // 200ms animation + 6×30ms max stagger
    }, 380);
  }, [shufflePhase, shuffleLetters]);

  useEffect(() => {
    return () => {
      if (shuffleTimerRef.current) clearTimeout(shuffleTimerRef.current);
    };
  }, []);

  // Keyboard support
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!puzzle) return;
    const allLetters = [puzzle.center_letter, ...puzzle.outer_letters].map((l) => l.toLowerCase());
    if (e.key === 'Enter') {
      submitWord();
    } else if (e.key === 'Backspace') {
      deleteLetter();
    } else if (allLetters.includes(e.key.toLowerCase())) {
      addLetter(e.key.toUpperCase());
    }
  }, [puzzle, submitWord, deleteLetter, addLetter]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!puzzle) return <PuzzleLoading />;

  const shareText = generateShareText(
    'buchstaebli',
    puzzle.date,
    `${score} Punkte · ${foundWords.length} Wörter · ${currentRank.charAt(0).toUpperCase() + currentRank.slice(1)}`,
  );

  return (
    <GameShell>
      {isStale && <NewPuzzleBanner onRefresh={refresh} />}
      <GameHeader title="Buchstäbli" puzzleNumber={1} onInfoClick={() => setShowHowToPlay(true)} />

      {showHowToPlay && (
        <HowToPlayModal
          gameId="buchstaebli"
          title="Buchstäbli"
          steps={BUCHSTAEBLI_STEPS}
          onClose={() => setShowHowToPlay(false)}
        />
      )}

      <RankBar
        currentRank={currentRank}
        score={score}
        maxScore={puzzle.max_score}
        thresholds={puzzle.rank_thresholds}
      />

      <HexGrid
        centerLetter={puzzle.center_letter}
        outerLetters={outerLetters}
        onLetterClick={addLetter}
        shufflePhase={shufflePhase}
      />

      {/* Input display */}
      <div
        className={`mx-auto mt-2 flex h-12 max-w-[320px] items-center justify-center rounded border-2 bg-white px-4 text-lg font-bold tracking-widest transition-colors duration-[var(--transition-fast)] ${
          shaking ? 'animate-[shake_400ms_ease]' : ''
        } ${
          inputFlash === 'success'
            ? 'border-[var(--color-green)]'
            : inputFlash === 'error'
              ? 'border-[var(--color-pink)]'
              : 'border-[var(--color-gray-bg)]'
        }`}
      >
        {currentInput || <span className="text-[var(--color-gray-text)] font-normal text-base">Tippe Buchstaben...</span>}
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex justify-center gap-3">
        <button
          onClick={handleShuffle}
          disabled={shufflePhase !== null}
          className="rounded border border-[var(--color-gray-bg)] px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          Mischen
        </button>
        <button
          onClick={clearInput}
          disabled={!currentInput}
          className="rounded border border-[var(--color-gray-bg)] px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          Löschen
        </button>
        <button
          onClick={submitWord}
          disabled={currentInput.length < 4}
          className="rounded bg-[var(--color-cyan)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          Enter ↵
        </button>
      </div>

      {/* Found words */}
      {foundWords.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-[var(--color-gray-text)]">
            Gefundene Wörter ({foundWords.length}):
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {foundWords.map((fw) => (
              <span
                key={fw.word}
                className={`inline-block rounded px-2 py-0.5 text-sm font-semibold ${
                  fw.is_pangram
                    ? 'bg-[var(--color-pink)] text-white'
                    : fw.is_mundart
                      ? 'bg-[var(--color-green)] text-white'
                      : 'bg-[var(--color-gray-bg)] text-[var(--color-black)]'
                } ${fw.word === newestWord ? 'animate-[popIn_300ms_ease]' : ''}`}
              >
                {fw.word.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Share */}
      <div className="mt-6 text-center">
        <ShareButton text={shareText} />
      </div>
    </GameShell>
  );
}
