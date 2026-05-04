-- Admin role + RLS policies. Replaces the hardcoded admin password gate at
-- /admin with a real Supabase Auth boundary plus role-gated table writes.
--
-- This migration was applied to the production project (fosnshalcgwvatejpdok)
-- on 2026-05-04 via the Supabase MCP. Captured here so the schema can be
-- rebuilt from source.
--
-- Provisioning admins (run separately, NOT in this migration):
--   update auth.users
--   set raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb),
--                                      '{role}', '"admin"'::jsonb)
--   where email = '<editor-email>';

-- ============================================================
-- is_admin() helper. app_metadata is only writable with the service role
-- key, so a regular signed-in player cannot self-promote. search_path is
-- pinned to '' to satisfy the database linter (`auth.jwt()` is fully
-- qualified, no ambient schema needed).
-- ============================================================

create or replace function public.is_admin() returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ============================================================
-- verbindige_editions — close the open-write hole.
--
-- The previous "Authenticated users can manage editions" policy used
-- USING (true), so any magic-link player could insert/update/delete rows
-- in this table directly via the anon key. Replace with admin-only writes;
-- keep public read of published rows; add admin read of all rows so the
-- editor UI can list drafts and scheduled editions.
-- ============================================================

drop policy if exists "Authenticated users can manage editions" on public.verbindige_editions;
drop policy if exists "Admins can read all editions"            on public.verbindige_editions;
drop policy if exists "Admins can manage editions"              on public.verbindige_editions;

create policy "Admins can read all editions"
  on public.verbindige_editions
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can manage editions"
  on public.verbindige_editions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- The pre-existing "Anyone can read published editions" SELECT policy is
-- intentionally NOT touched — it gates public reads on status='published'.

-- ============================================================
-- Puzzle tables — defence-in-depth admin write policies.
--
-- Today writes are blocked at the RLS layer (no INSERT/UPDATE/DELETE
-- policies exist) and only the cms-mutate service-role client can write.
-- After this migration, an admin's logged-in client can also write directly
-- if needed, and the Edge Function can rely on RLS as a second defence
-- behind its JWT-role check.
-- ============================================================

do $$
declare t text;
begin
  foreach t in array array[
    'puzzles',
    'verbindige_puzzles',
    'zaemesetzli_puzzles',
    'schlagloch_puzzles',
    'quizzhuber_puzzles',
    'aufgedeckt_puzzles',
    'quizzticle_puzzles',
    'buchstaebli_puzzles'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', 'Admins can write ' || t, t);
    execute format($f$
      create policy %I
        on public.%I
        for all
        to authenticated
        using (public.is_admin())
        with check (public.is_admin())
    $f$, 'Admins can write ' || t, t);
  end loop;
end$$;
