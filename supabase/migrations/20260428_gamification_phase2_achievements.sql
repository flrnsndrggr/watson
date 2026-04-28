-- Phase 2 — achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked
  ON user_achievements (user_id, unlocked_at DESC);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Insert own achievements" ON user_achievements;
CREATE POLICY "Read own achievements" ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Insert own achievements" ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);
