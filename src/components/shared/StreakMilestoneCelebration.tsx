import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameType } from '@/types';
import {
  STREAK_MILESTONE_EVENT,
  type StreakMilestoneDetail,
} from '@/lib/streakMilestoneEvent';

// ---- Milestone copy ----

interface MilestoneCopy {
  heading: string;
  subheading: string;
  /** Emoji shown large in the center. */
  emoji: string;
}

const GAME_LABELS: Record<GameType, string> = {
  verbindige: 'Verbindige',
  zaemesetzli: 'Zamesetzli',
  schlagloch: 'Schlagloch',
  quizzhuber: 'Quizzhuber',
  aufgedeckt: 'Aufgedeckt',
  quizzticle: 'Quizzticle',
};

function getMilestoneCopy(streak: number): MilestoneCopy {
  if (streak >= 365) return { heading: 'Ein ganzes Jahr!', subheading: 'Du bist eine Legende. 365 Tage in Folge.', emoji: '👑' };
  if (streak >= 100) return { heading: 'Hunderter-Streak!', subheading: 'Hundert Tage. Das ist purer Wahnsinn.', emoji: '💯' };
  if (streak >= 50)  return { heading: 'Fünfzig Tage!', subheading: 'Halb auf dem Weg zur Legende.', emoji: '⭐' };
  if (streak >= 30)  return { heading: 'Monats-Streak!', subheading: '30 Tage am Stuck. Huere stark.', emoji: '🏆' };
  if (streak >= 14)  return { heading: 'Zwei Wochen!', subheading: 'Vierzehn Tage — du bleibst dra.', emoji: '💪' };
  return { heading: 'Wochen-Streak!', subheading: 'Sieben Tage in Folge. Läuft bi dir!', emoji: '🔥' };
}

// ---- Celebration host (mounted once in Layout) ----

/**
 * Full-screen overlay that celebrates streak milestones. Listens for
 * `watson:streak-milestone` custom events dispatched from streaks.ts.
 *
 * Renders a centered modal with:
 * - Big animated streak number
 * - Watson-flavored Swiss German copy
 * - Joker earned notification (if applicable)
 * - Confetti burst
 * - Dismiss on click/Escape/timeout (6s)
 */
export function StreakMilestoneCelebrationHost() {
  const [milestone, setMilestone] = useState<StreakMilestoneDetail | null>(null);
  const [visible, setVisible] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confettiFiredRef = useRef(false);

  // Listen for milestone events.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<StreakMilestoneDetail>).detail;
      if (!detail) return;
      setMilestone(detail);
      setVisible(true);
      confettiFiredRef.current = false;
    };
    window.addEventListener(STREAK_MILESTONE_EVENT, handler);
    return () => window.removeEventListener(STREAK_MILESTONE_EVENT, handler);
  }, []);

  // Auto-dismiss after 6 seconds.
  useEffect(() => {
    if (!visible) return;
    dismissTimerRef.current = setTimeout(() => setVisible(false), 6000);
    return () => { if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current); };
  }, [visible]);

  // Fire confetti when modal becomes visible.
  useEffect(() => {
    if (!visible || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    void fireConfetti();
  }, [visible]);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  }, []);

  // Keyboard dismiss.
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, dismiss]);

  // Cleanup after exit animation.
  useEffect(() => {
    if (visible || !milestone) return;
    const t = setTimeout(() => setMilestone(null), 400);
    return () => clearTimeout(t);
  }, [visible, milestone]);

  if (!milestone) return null;

  const copy = getMilestoneCopy(milestone.streak);
  const gameLabel = GAME_LABELS[milestone.game];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Streak-Meilenstein: ${milestone.streak} Tage`}
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${
        visible
          ? 'animate-[milestoneOverlayIn_300ms_ease-out_forwards]'
          : 'animate-[milestoneOverlayOut_300ms_ease-in_forwards]'
      }`}
      onClick={dismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Card */}
      <div
        className={`relative w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl bg-white shadow-2xl ${
          visible
            ? 'animate-[milestonePop_500ms_cubic-bezier(0.34,1.56,0.64,1)_forwards]'
            : 'animate-[milestoneOut_250ms_ease-in_forwards]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar — pink gradient */}
        <div
          className="h-1.5 w-full bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-pink)] to-[var(--color-cyan)]"
          aria-hidden="true"
        />

        <div className="px-6 pb-6 pt-5 text-center">
          {/* Emoji */}
          <div
            className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-pink)]/10 text-4xl animate-[bounceIn_500ms_ease]"
            aria-hidden="true"
          >
            {copy.emoji}
          </div>

          {/* Big streak number */}
          <div className="animate-[milestoneNumberPop_600ms_cubic-bezier(0.34,1.56,0.64,1)_200ms_both]">
            <span className="font-[family-name:var(--font-heading)] text-5xl font-black text-[var(--color-pink)]">
              {milestone.streak}
            </span>
            <span className="ml-1 text-lg font-semibold text-[var(--color-gray-text)]">
              Tage
            </span>
          </div>

          {/* Heading */}
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--color-black)]">
            {copy.heading}
          </h2>

          {/* Subheading */}
          <p className="mt-1 text-sm text-[var(--color-gray-text)]">
            {copy.subheading}
          </p>

          {/* Game badge */}
          <p className="mt-2 text-xs font-semibold text-[var(--color-cyan)]">
            {gameLabel}
          </p>

          {/* Joker earned notification */}
          {milestone.jokerEarned && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[var(--color-cyan)]/10 px-4 py-2.5 animate-[cardEnter_400ms_ease-out_400ms_both]">
              <span className="text-lg" role="img" aria-label="Joker">
                🃏
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--color-cyan)]">
                  Joker verdient!
                </p>
                <p className="text-[11px] text-[var(--color-gray-text)]">
                  {milestone.jokersBanked} {milestone.jokersBanked === 1 ? 'Joker' : 'Joker'} gespeichert
                </p>
              </div>
            </div>
          )}

          {/* Dismiss button */}
          <button
            type="button"
            className="mt-5 w-full rounded-lg bg-[var(--color-pink)] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-85 active:opacity-75"
            onClick={dismiss}
          >
            Weiter spielen
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Confetti (dynamic import, same pattern as game pages) ----

async function fireConfetti(): Promise<void> {
  try {
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default;

    // Double burst from left and right — celebration feels big.
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.3, y: 0.5 },
      colors: ['#F40F97', '#00C6FF', '#7BD400', '#FFD700'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.7, y: 0.5 },
      colors: ['#F40F97', '#00C6FF', '#7BD400', '#FFD700'],
      disableForReducedMotion: true,
    });
  } catch {
    // canvas-confetti not available — degrade silently
  }
}

