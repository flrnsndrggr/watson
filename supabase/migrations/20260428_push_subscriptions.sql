-- Phase 4 — Web Push, prepared for future watson.ch SSO
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  external_user_id  text,
  account_provider  text DEFAULT 'supabase',
  endpoint          text NOT NULL UNIQUE,
  p256dh_key        text NOT NULL,
  auth_key          text NOT NULL,
  user_agent        text,
  reminder_hour     smallint NOT NULL DEFAULT 8 CHECK (reminder_hour BETWEEN 0 AND 23),
  enabled           boolean NOT NULL DEFAULT true,
  last_seen_at      timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_user        ON push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_push_external    ON push_subscriptions (external_user_id);
CREATE INDEX IF NOT EXISTS idx_push_reminder    ON push_subscriptions (reminder_hour) WHERE enabled = true;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own push subs"   ON push_subscriptions;
DROP POLICY IF EXISTS "Insert own push subs" ON push_subscriptions;
DROP POLICY IF EXISTS "Update own push subs" ON push_subscriptions;
DROP POLICY IF EXISTS "Delete own push subs" ON push_subscriptions;
CREATE POLICY "Read own push subs"   ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own push subs" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own push subs" ON push_subscriptions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own push subs" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS external_user_id text,
  ADD COLUMN IF NOT EXISTS account_provider text DEFAULT 'supabase';
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_external_unique
  ON user_profiles (external_user_id) WHERE external_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.upsert_anon_push_subscription(
  p_endpoint text, p_p256dh text, p_auth text, p_user_agent text, p_reminder_hour smallint
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO push_subscriptions (endpoint, p256dh_key, auth_key, user_agent, reminder_hour, account_provider, user_id)
  VALUES (p_endpoint, p_p256dh, p_auth, p_user_agent, p_reminder_hour, 'anon', NULL)
  ON CONFLICT (endpoint) DO UPDATE
    SET p256dh_key = EXCLUDED.p256dh_key, auth_key = EXCLUDED.auth_key, user_agent = EXCLUDED.user_agent,
        reminder_hour = EXCLUDED.reminder_hour, last_seen_at = now()
    WHERE push_subscriptions.user_id IS NULL
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.upsert_anon_push_subscription(text, text, text, text, smallint) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.link_push_subscription_to_user(p_endpoint text)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE push_subscriptions SET user_id = auth.uid(), account_provider = 'supabase', last_seen_at = now()
  WHERE endpoint = p_endpoint AND (user_id IS NULL OR user_id = auth.uid())
  RETURNING id;
$$;
GRANT EXECUTE ON FUNCTION public.link_push_subscription_to_user(text) TO authenticated;
