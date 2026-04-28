-- Phase 3 — period leaderboards (week / month / all-time)
CREATE OR REPLACE FUNCTION public.get_leaderboard_summary(
  p_game_type   text,
  p_start_date  text,
  p_end_date    text,
  p_limit       int DEFAULT 10
)
RETURNS TABLE (
  display_name  text,
  total_score   bigint,
  plays         bigint,
  is_current_user boolean,
  rank          bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      le.user_id,
      le.display_name,
      SUM(le.score)::bigint AS total_score,
      COUNT(*)::bigint AS plays
    FROM leaderboard_entries le
    WHERE le.game_type = p_game_type
      AND le.puzzle_date >= p_start_date
      AND le.puzzle_date <= p_end_date
    GROUP BY le.user_id, le.display_name
  ),
  ranked AS (
    SELECT
      base.*,
      RANK() OVER (ORDER BY total_score DESC, plays DESC) AS rk
    FROM base
  ),
  top AS (
    SELECT * FROM ranked WHERE rk <= p_limit ORDER BY rk
  ),
  me AS (
    SELECT * FROM ranked
    WHERE user_id = auth.uid()
      AND rk > p_limit
  )
  SELECT
    display_name,
    total_score,
    plays,
    user_id = auth.uid() AS is_current_user,
    rk AS rank
  FROM top
  UNION ALL
  SELECT
    display_name,
    total_score,
    plays,
    true AS is_current_user,
    rk AS rank
  FROM me
  ORDER BY rank;
$$;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_summary(text, text, text, int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_leaderboard_total(
  p_game_type   text,
  p_start_date  text,
  p_end_date    text
)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT user_id)::bigint
  FROM leaderboard_entries
  WHERE game_type = p_game_type
    AND puzzle_date >= p_start_date
    AND puzzle_date <= p_end_date;
$$;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_total(text, text, text) TO anon, authenticated;
