// ===== Verbindige (Mundart Connections) =====

export interface VerbindigePuzzle {
  id: string;
  date: string;
  groups: VerbindigeGroup[];
}

export interface VerbindigeGroup {
  category: string;
  category_label?: string;       // Hochdeutsch reveal label
  difficulty: 1 | 2 | 3 | 4;
  items: VerbindigeItem[];
}

export interface VerbindigeItem {
  text: string;
  mundart_word?: string;          // dialect word displayed
  hochdeutsch?: string;           // standard German translation (shown post-solve)
  region?: string;                // canton/region of origin
  image_url?: string;
  emoji?: string;
}

// ===== Zämesetzli (Compound Word Builder) =====

export interface ZaemesetzliPuzzle {
  id: string;
  date: string;
  emojis: EmojiItem[];
  valid_compounds: CompoundWord[];
  max_score: number;
  rank_thresholds: RankThresholds;
}

export interface EmojiItem {
  emoji: string;
  canonical_noun: string;
  alt_nouns: string[];
}

export interface CompoundWord {
  word: string;
  components: string[];
  difficulty: 1 | 2 | 3;
  points: number;
  is_mundart: boolean;
  hint?: string;
}

// ===== Shared Rank System =====

export interface RankThresholds {
  stift: 0;
  lehrling: number;
  geselle: number;
  meister: number;
  bundesrat: number;
}

export type Rank = keyof RankThresholds;

// ===== Schlagloch (The watson Archive Headline Game) =====

export interface SchlaglochPuzzle {
  id: string;
  date: string;
  headlines: SchlaglochHeadline[];
}

export interface SchlaglochHeadline {
  display: string;
  article_url: string;
  article_year: number;
  article_date: string;
  category: string;
  difficulty: 1 | 2 | 3;
  context_hint?: string;
}

export interface SchlaglochGuessResult {
  correct: boolean;
  accepted_answer?: string;
}

// ===== User & Streaks =====

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  created_at: string;
  streaks: {
    verbindige: StreakData;
    zaemesetzli: StreakData;
    schlagloch: StreakData;
  };
}

export interface StreakData {
  current: number;
  longest: number;
  last_played: string;
}

// ===== Branded Verbindige Editions =====

export interface VerbindigeEdition {
  id: string;
  slug: string;
  title: string;
  sponsor_name: string;
  sponsor_logo_url: string | null;
  sponsor_click_url: string | null;
  groups: VerbindigeGroup[];
  status: 'draft' | 'published';
  publish_date: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Quizzhuber (10-question persona-driven trivia, weekly) =====
// Inspired by watson.ch's "Quizz den Huber" — a recurring host challenges
// the reader; format stays identical episode-to-episode, content rotates.

export interface QuizzhuberPuzzle {
  id: string;
  date: string;
  /** Episode number, displayed in the header. */
  episode: number;
  /** Editorial intro paragraph from the host. */
  intro: string;
  questions: QuizzhuberQuestion[];
}

export interface QuizzhuberQuestion {
  prompt: string;
  /** 4 options. The first array entry is correct unless `correct_index` overrides. */
  options: string[];
  correct_index: number;
  explanation?: string;
  category?: string;
}

// ===== Aufgedeckt (image-tile reveal, weekly) =====
// 10 hidden images per session; player reveals tiles one at a time and
// types the answer. Score is correct count + total tiles revealed (lower
// is better on the second axis).

export interface AufgedecktPuzzle {
  id: string;
  date: string;
  episode: number;
  /** Tile-count threshold mentioned in the title (e.g. "Bei unter 20 Feldern …"). */
  threshold: number;
  rounds: AufgedecktRound[];
}

export interface AufgedecktRound {
  image_url: string;
  /** Canonical answer for display after the round. */
  answer: string;
  accepted_answers: string[];
  /** Grid columns × rows for the tile mask. Defaults to 5×5 if not set. */
  cols?: number;
  rows?: number;
  hint?: string;
}

// ===== Quizzticle (timed list-fill, weekly) =====
// One large list of N items belonging to a category; player types as
// many as they can within a time limit. Order doesn't matter; auto-snap
// on match.

export interface QuizzticlePuzzle {
  id: string;
  date: string;
  episode: number;
  prompt: string;
  /** Total slot count. Typical: 30, sometimes 50 / 60. */
  slot_count: number;
  /** Seconds on the timer. Default 1200 (20 min). */
  duration_seconds: number;
  /** Each entry is one acceptable answer set; first element is the canonical display. */
  items: QuizzticleItem[];
  /** Optional category for badge display. */
  category?: string;
}

export interface QuizzticleItem {
  display: string;
  accepted_answers: string[];
}

// ===== Game State =====

export type GameType =
  | 'verbindige'
  | 'zaemesetzli'
  | 'schlagloch'
  | 'quizzhuber'
  | 'aufgedeckt'
  | 'quizzticle';

/** Extended type that includes game variants used for separate leaderboards. */
export type LeaderboardGameType = GameType | 'schlagloch_rueckblick';

export type GameStatus = 'loading' | 'playing' | 'won' | 'lost';
