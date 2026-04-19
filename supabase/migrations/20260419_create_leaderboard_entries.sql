-- Leaderboard entries: one per user per game per day
CREATE TABLE leaderboard_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type text NOT NULL CHECK (game_type IN ('verbindige', 'schlagziil', 'zaemesetzli', 'buchstaebli')),
  puzzle_date text NOT NULL,
  score integer NOT NULL,
  time_seconds integer,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, game_type, puzzle_date)
);

-- Index for fast daily leaderboard queries
CREATE INDEX idx_leaderboard_daily ON leaderboard_entries (game_type, puzzle_date, score DESC, time_seconds ASC NULLS LAST);

-- RLS
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard"
  ON leaderboard_entries FOR SELECT
  USING (true);

CREATE POLICY "Auth users can insert own entries"
  ON leaderboard_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auth users can update own entries"
  ON leaderboard_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
