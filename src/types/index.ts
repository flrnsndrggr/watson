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

// ===== Schlagziil (The watson Archive Headline Game) =====

export interface SchlagziilPuzzle {
  id: string;
  date: string;
  headlines: SchlagziilHeadline[];
}

export interface SchlagziilHeadline {
  display: string;
  article_url: string;
  article_year: number;
  article_date: string;
  category: string;
  difficulty: 1 | 2 | 3;
  context_hint?: string;
}

export interface SchlagziilGuessResult {
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
    schlagziil: StreakData;
  };
}

export interface StreakData {
  current: number;
  longest: number;
  last_played: string;
}

// ===== Game State =====

export type GameType = 'verbindige' | 'zaemesetzli' | 'schlagziil';

export type GameStatus = 'loading' | 'playing' | 'won' | 'lost';
