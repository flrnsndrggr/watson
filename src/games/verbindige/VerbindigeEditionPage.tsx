import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GameShell } from '@/components/shared/GameShell';
import { GameHeader } from '@/components/shared/GameHeader';
import { ErrorDots } from '@/components/shared/ErrorDots';
import { PuzzleLoading } from '@/components/shared/PuzzleLoading';
import { HowToPlayModal } from '@/components/shared/HowToPlayModal';
import { VERBINDIGE_STEPS } from '@/lib/howToPlayContent';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { fetchEditionBySlug } from '@/lib/supabase';
import type { VerbindigeEdition } from '@/types';
import { VerbindigeBoard } from './VerbindigeBoard';
import { VerbindigeResult } from './VerbindigeResult';
import { useVerbindige } from './useVerbindige';

export function VerbindigeEditionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [edition, setEdition] = useState<VerbindigeEdition | null>(null);
  const [notFound, setNotFound] = useState(false);

  const {
    puzzle,
    status,
    selected,
    submitGuess,
    clearSelection,
    shuffleRemaining,
    mistakes,
    maxMistakes,
    pendingCorrect,
  } = useVerbindige();

  const store = useVerbindige;
  const reducedMotion = usePrefersReducedMotion();
  const [shufflePhase, setShufflePhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [revealComplete, setRevealComplete] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Load edition from Supabase, then inject as puzzle into the Verbindige store
  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    (async () => {
      const data = await fetchEditionBySlug(slug);
      if (cancelled) return;

      if (!data) {
        setNotFound(true);
        return;
      }

      setEdition(data);

      // Inject the edition as a puzzle into the store
      // We mark it as an "archive" so streaks/leaderboard are not affected
      const puzzleData = {
        id: `edition-${data.slug}`,
        date: data.publish_date ?? '',
        groups: data.groups,
      };

      // Shuffle items and set as playing
      const allItems = puzzleData.groups.flatMap((g) => g.items);
      const shuffled = [...allItems].sort(() => Math.random() - 0.5);

      store.setState({
        puzzle: puzzleData,
        remainingItems: shuffled,
        status: 'playing',
        selected: [],
        solvedGroups: [],
        mistakes: 0,
        previousGuesses: [],
        isArchive: true, // branded editions don't count for streaks
        startedAt: Date.now(),
        elapsedSeconds: null,
        pendingCorrect: null,
        lastGuessResult: null,
        lastWrongItems: [],
      });
    })();

    return () => { cancelled = true; };
  }, [slug, store]);

  const handleShuffle = useCallback(() => {
    if (shufflePhase !== 'idle') return;
    clearSelection();
    setShufflePhase('out');
    setTimeout(() => {
      shuffleRemaining();
      setShufflePhase('in');
      setTimeout(() => setShufflePhase('idle'), 300);
    }, 300);
  }, [shufflePhase, clearSelection, shuffleRemaining]);

  const handleRevealComplete = useCallback(() => {
    setRevealComplete(true);
  }, []);

  // Keyboard support
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (status !== 'playing' || pendingCorrect != null) return;
    if (e.key === 'Enter' && selected.length === 4) {
      submitGuess();
    } else if (e.key === 'Backspace') {
      clearSelection();
    }
  }, [status, pendingCorrect, selected.length, submitGuess, clearSelection]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (status === 'won' && !reducedMotion) {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      });
    }
  }, [status, reducedMotion]);

  useEffect(() => {
    if (status === 'playing') setRevealComplete(false);
  }, [status]);

  if (notFound) {
    return (
      <GameShell>
        <div className="py-12 text-center">
          <h1 className="text-xl font-bold mb-2">Edition nicht gefunden</h1>
          <p className="text-sm text-[var(--color-gray-text)]">
            Diese Branded Edition existiert nicht oder ist nicht veröffentlicht.
          </p>
        </div>
      </GameShell>
    );
  }

  if (status === 'loading' || !edition) return <PuzzleLoading />;

  const sponsor = {
    name: edition.sponsor_name,
    logoUrl: edition.sponsor_logo_url ?? undefined,
    clickUrl: edition.sponsor_click_url ?? undefined,
  };

  const isPlaying = status === 'playing';
  const showResult = status === 'won' || (status === 'lost' && revealComplete);

  return (
    <GameShell sponsor={sponsor}>
      <GameHeader
        title={edition.title}
        puzzleId={puzzle?.date ?? ''}
        subtitle="Finde 4 Gruppen à 4"
        onInfoClick={() => setShowHowToPlay(true)}
      />

      {showHowToPlay && (
        <HowToPlayModal
          gameId="verbindige"
          title="Verbindige"
          steps={VERBINDIGE_STEPS}
          onClose={() => setShowHowToPlay(false)}
        />
      )}

      <VerbindigeBoard
        shufflePhase={shufflePhase}
        onRevealComplete={handleRevealComplete}
      />

      {isPlaying && (
        <div className="mt-4 flex items-center justify-between">
          <ErrorDots total={maxMistakes} used={mistakes} />
          <div className="flex gap-2">
            <button
              onClick={handleShuffle}
              disabled={shufflePhase !== 'idle' || pendingCorrect != null}
              className="min-h-[44px] rounded border border-[var(--color-gray-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-black)] transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              Mischen
            </button>
            <button
              onClick={clearSelection}
              disabled={selected.length === 0 || pendingCorrect != null}
              className="min-h-[44px] rounded border border-[var(--color-gray-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-black)] transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              Löschen
            </button>
            <button
              onClick={submitGuess}
              disabled={selected.length !== 4 || pendingCorrect != null}
              className="min-h-[44px] rounded bg-[var(--color-cyan)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              Prüfen
            </button>
          </div>
        </div>
      )}

      {showResult && <VerbindigeResult />}
    </GameShell>
  );
}
