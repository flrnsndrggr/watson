-- Recurring watson.ch-inspired formats: Quizzhuber, Aufgedeckt, Quizzticle.
ALTER TABLE puzzles DROP CONSTRAINT IF EXISTS puzzles_game_type_check;
ALTER TABLE puzzles ADD CONSTRAINT puzzles_game_type_check
  CHECK (game_type IN ('verbindige','zaemesetzli','schlagloch','buchstaebli','quizzhuber','aufgedeckt','quizzticle'));

ALTER TABLE leaderboard_entries DROP CONSTRAINT IF EXISTS leaderboard_entries_game_type_check;
ALTER TABLE leaderboard_entries ADD CONSTRAINT leaderboard_entries_game_type_check
  CHECK (game_type IN ('verbindige','schlagloch','zaemesetzli','schlagloch_rueckblick','quizzhuber','aufgedeckt','quizzticle'));

CREATE TABLE IF NOT EXISTS quizzhuber_puzzles (
  id uuid PRIMARY KEY,
  episode int NOT NULL,
  intro text NOT NULL,
  questions jsonb NOT NULL
);
ALTER TABLE quizzhuber_puzzles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read quizzhuber puzzles" ON quizzhuber_puzzles;
CREATE POLICY "Public can read quizzhuber puzzles" ON quizzhuber_puzzles FOR SELECT
  USING (EXISTS (SELECT 1 FROM puzzles WHERE puzzles.id = quizzhuber_puzzles.id AND puzzles.publish_date <= CURRENT_DATE));

CREATE TABLE IF NOT EXISTS aufgedeckt_puzzles (
  id uuid PRIMARY KEY,
  episode int NOT NULL,
  threshold int NOT NULL DEFAULT 20,
  rounds jsonb NOT NULL
);
ALTER TABLE aufgedeckt_puzzles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read aufgedeckt puzzles" ON aufgedeckt_puzzles;
CREATE POLICY "Public can read aufgedeckt puzzles" ON aufgedeckt_puzzles FOR SELECT
  USING (EXISTS (SELECT 1 FROM puzzles WHERE puzzles.id = aufgedeckt_puzzles.id AND puzzles.publish_date <= CURRENT_DATE));

CREATE TABLE IF NOT EXISTS quizzticle_puzzles (
  id uuid PRIMARY KEY,
  episode int NOT NULL,
  prompt text NOT NULL,
  slot_count int NOT NULL,
  duration_seconds int NOT NULL DEFAULT 1200,
  items jsonb NOT NULL,
  category text
);
ALTER TABLE quizzticle_puzzles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read quizzticle puzzles" ON quizzticle_puzzles;
CREATE POLICY "Public can read quizzticle puzzles" ON quizzticle_puzzles FOR SELECT
  USING (EXISTS (SELECT 1 FROM puzzles WHERE puzzles.id = quizzticle_puzzles.id AND puzzles.publish_date <= CURRENT_DATE));
