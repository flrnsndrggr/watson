import type { GameType } from '@/types';

// ---- Core analytics event types ----

interface GameStartedEvent {
  event: 'game_started';
  game: GameType;
  is_archive: boolean;
}

interface GameCompletedEvent {
  event: 'game_completed';
  game: GameType;
  result: 'won' | 'lost' | 'complete';
  score?: number;
  elapsed_seconds?: number | null;
  is_archive: boolean;
}

interface GameSharedEvent {
  event: 'game_shared';
  game: GameType;
  method: 'share_api' | 'clipboard';
}

interface StreakMilestoneEvent {
  event: 'streak_milestone';
  game: GameType;
  streak_length: number;
}

// ---- Game-specific event types ----

interface VerbindigeGuessEvent {
  event: 'verbindige_guess';
  result: 'correct' | 'wrong' | 'one-away' | 'duplicate';
  guess_number: number;
  mistakes: number;
  difficulty?: 1 | 2 | 3 | 4;
}

interface SchlagziilHeadlineGuessEvent {
  event: 'schlagziil_headline_guess';
  result: 'correct' | 'wrong';
  headline_index: number;
  difficulty: 1 | 2 | 3;
  hint_used: boolean;
}

interface ZaemesetzliWordFoundEvent {
  event: 'zaemesetzli_word_found';
  word_difficulty: 1 | 2 | 3;
  is_mundart: boolean;
  points: number;
  score_after: number;
  words_found: number;
}

interface ZaemesetzliHintUsedEvent {
  event: 'zaemesetzli_hint_used';
  hints_used: number;
}

type AnalyticsEvent =
  | GameStartedEvent
  | GameCompletedEvent
  | GameSharedEvent
  | StreakMilestoneEvent
  | VerbindigeGuessEvent
  | SchlagziilHeadlineGuessEvent
  | ZaemesetzliWordFoundEvent
  | ZaemesetzliHintUsedEvent;

// ---- Listener registry ----

type AnalyticsListener = (event: AnalyticsEvent) => void;

const listeners: AnalyticsListener[] = [];

/**
 * Register a listener that receives all analytics events.
 * Use this to wire up Google Analytics, PostHog, or any other provider.
 *
 * Returns an unsubscribe function.
 *
 * @example
 * ```ts
 * onAnalyticsEvent((e) => {
 *   gtag('event', e.event, e);
 * });
 * ```
 */
export function onAnalyticsEvent(listener: AnalyticsListener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function emit(event: AnalyticsEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Never let analytics break the app
    }
  }
}

// ---- Public tracking functions ----

export function trackGameStarted(game: GameType, isArchive: boolean): void {
  emit({ event: 'game_started', game, is_archive: isArchive });
}

export function trackGameCompleted(
  game: GameType,
  result: 'won' | 'lost' | 'complete',
  isArchive: boolean,
  score?: number,
  elapsedSeconds?: number | null,
): void {
  emit({
    event: 'game_completed',
    game,
    result,
    score,
    elapsed_seconds: elapsedSeconds,
    is_archive: isArchive,
  });
}

export function trackGameShared(game: GameType, method: 'share_api' | 'clipboard'): void {
  emit({ event: 'game_shared', game, method });
}

export function trackStreakMilestone(game: GameType, streakLength: number): void {
  emit({ event: 'streak_milestone', game, streak_length: streakLength });
}

// ---- Streak milestone detection ----

const MILESTONE_THRESHOLDS = [3, 7, 14, 30, 50, 100];

/**
 * Call after recording a streak. Fires streak_milestone if the new
 * streak length exactly hits a threshold.
 */
export function checkStreakMilestone(game: GameType, streakLength: number): void {
  if (MILESTONE_THRESHOLDS.includes(streakLength)) {
    trackStreakMilestone(game, streakLength);
  }
}

// ---- Game-specific tracking functions ----

export function trackVerbindigeGuess(
  result: 'correct' | 'wrong' | 'one-away' | 'duplicate',
  guessNumber: number,
  mistakes: number,
  difficulty?: 1 | 2 | 3 | 4,
): void {
  emit({ event: 'verbindige_guess', result, guess_number: guessNumber, mistakes, difficulty });
}

export function trackSchlagziilHeadlineGuess(
  result: 'correct' | 'wrong',
  headlineIndex: number,
  difficulty: 1 | 2 | 3,
  hintUsed: boolean,
): void {
  emit({ event: 'schlagziil_headline_guess', result, headline_index: headlineIndex, difficulty, hint_used: hintUsed });
}

export function trackZaemesetzliWordFound(
  wordDifficulty: 1 | 2 | 3,
  isMundart: boolean,
  points: number,
  scoreAfter: number,
  wordsFound: number,
): void {
  emit({ event: 'zaemesetzli_word_found', word_difficulty: wordDifficulty, is_mundart: isMundart, points, score_after: scoreAfter, words_found: wordsFound });
}

export function trackZaemesetzliHintUsed(hintsUsed: number): void {
  emit({ event: 'zaemesetzli_hint_used', hints_used: hintsUsed });
}
