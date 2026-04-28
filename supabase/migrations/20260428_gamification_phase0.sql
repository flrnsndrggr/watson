-- Phase 0 — gamification plumbing
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type    text NOT NULL CHECK (game_type IN
                  ('verbindige', 'schlagloch', 'zaemesetzli', 'schlagloch_rueckblick')),
  puzzle_date  text NOT NULL,
  score        integer NOT NULL,
  time_seconds integer,
  display_name text NOT NULL,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, game_type, puzzle_date)
);
CREATE INDEX IF NOT EXISTS idx_leaderboard_daily
  ON leaderboard_entries (game_type, puzzle_date, score DESC, time_seconds ASC NULLS LAST);
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read leaderboard" ON leaderboard_entries;
DROP POLICY IF EXISTS "Auth users insert own leaderboard" ON leaderboard_entries;
DROP POLICY IF EXISTS "Auth users update own leaderboard" ON leaderboard_entries;
CREATE POLICY "Anyone can read leaderboard" ON leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Auth users insert own leaderboard" ON leaderboard_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users update own leaderboard" ON leaderboard_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS locale       text DEFAULT 'de-CH',
  ADD COLUMN IF NOT EXISTS streak_freezes_banked smallint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS account_prompt_dismissed_at timestamptz;

CREATE TABLE IF NOT EXISTS gamification_events (
  id         bigserial PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  anon_id    uuid,
  event_type text NOT NULL,
  game_type  text,
  payload    jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gam_events_user_time ON gamification_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gam_events_type_time ON gamification_events (event_type, created_at DESC);
ALTER TABLE gamification_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Insert own or anon" ON gamification_events;
DROP POLICY IF EXISTS "Read own" ON gamification_events;
CREATE POLICY "Insert own or anon" ON gamification_events FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Read own" ON gamification_events FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own streaks" ON streaks;
DROP POLICY IF EXISTS "Insert own streaks" ON streaks;
DROP POLICY IF EXISTS "Update own streaks" ON streaks;
CREATE POLICY "Read own streaks" ON streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own streaks" ON streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own streaks" ON streaks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
