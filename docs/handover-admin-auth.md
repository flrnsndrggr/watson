# Handover — Admin auth migration

## What changed

The `/admin` area used to be gated by a hardcoded password
(`'letsplayagame'`) shipped in the JS bundle. Anyone who opened devtools and
read the source could log in and edit puzzles. The `cms-mutate` Edge
Function used a matching shared secret (`VITE_CMS_SECRET` / `CMS_SECRET`) —
also visible in the bundle, also no real boundary. The `verbindige_editions`
table allowed any signed-in player to insert/update/delete rows.

All three holes are closed.

The `/admin` UI is now gated by **Supabase Auth** (`signInWithPassword` —
also works seamlessly with the existing magic-link flow once a user has
`app_metadata.role = 'admin'`). The Edge Function verifies the caller's JWT
server-side and rejects anyone whose role isn't `admin`. The puzzle tables
and `verbindige_editions` have admin-only write policies enforced by RLS.
Admin role is server-only (`raw_app_meta_data`, writable only with the
service role key), so a regular signed-up player cannot self-promote.

## Status — fully shipped

- ✅ Frontend deployed to https://games-watson.netlify.app (no hardcoded
  password, no `VITE_CMS_SECRET`).
- ✅ `cms-mutate` Edge Function deployed (v3) with JWT + admin-role check.
- ✅ RLS migration applied (`supabase/migrations/20260504_admin_role_rls.sql`):
  `is_admin()` helper, admin-only writes on every puzzle table, replaced
  the open-write `verbindige_editions` policy.
- ✅ First admin provisioned: `florian.sonderegger@me.com`.
- ✅ Verified: anon callers → 401 from the Edge Function, 401 from RLS on
  direct `verbindige_editions` writes.

## What you (product/ops) need to know

### Adding more admins

In the Supabase dashboard SQL editor, for an existing user (they can sign
up first via the player magic-link flow, or you invite them under
**Auth → Users**):

```sql
update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{role}', '"admin"'::jsonb
)
where email = 'editor@watson.ch';
```

After their next sign-in the JWT carries the new role and the **Admin**
link appears in their header. Magic-link users don't need a separate
password.

### Removing admin access

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data - 'role'
where email = 'editor@watson.ch';
```

Or delete the user. They're logged out within ~1 hour (access-token
lifetime); shorten by signing them out via the dashboard if urgent.

### The old password

`letsplayagame` no longer works — the modal calls Supabase Auth, which
rejects unknown credentials. **Stop sharing it.**

### Stale env vars to clean up (optional, low priority)

- **Netlify**: `VITE_CMS_SECRET` is no longer read by the build but may
  still be set on the site. Safe to delete from Netlify → Site settings →
  Environment variables.
- **Supabase Edge Function secrets**: `CMS_SECRET` is no longer read by
  `cms-mutate`. Safe to delete via `supabase secrets unset CMS_SECRET` or
  the dashboard.

Both removals are pure tidy-up — leaving them in place is harmless.

## Risks and rollback

- **If the new login breaks**: revert the relevant commits (`security:
  replace hardcoded admin password…` and `security: cut cms-mutate over to
  JWT auth…`) and redeploy. The old gate comes back. RLS policies can be
  rolled back with the inverse SQL — see `docs/admin-auth-rls.md` for the
  reusable templates.
- **Sessions**: Supabase persists the session in localStorage. Editors
  stay logged in across reloads until they explicitly hit Logout or the
  session expires (~1h access token, auto-refreshed via refresh token).
- **Concurrent editing**: no lock model. Same as before.

## Open questions for product

1. **Magic link vs password?** Magic-link works today (it's how the first
   admin signs in). The password modal in the `/admin` footer is a
   secondary path — only useful if a user has a password set (e.g. via a
   Supabase invite). Worth keeping or remove?
2. **Self-serve admin UI?** Promoting/demoting admins is a SQL edit today.
   Half-day add to ship a UI for it if you'll have more than 2–3 editors.
3. **Audit log?** No write history is captured. Worth adding once we have
   multiple editors making changes?
