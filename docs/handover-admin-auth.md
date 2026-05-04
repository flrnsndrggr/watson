# Handover — Admin auth migration

## What changed

The `/admin` area used to be gated by a hardcoded password
(`'letsplayagame'`) shipped in the JS bundle. Anyone who opened devtools and
read the source could log in and edit puzzles. That gate is gone.

It is replaced with **Supabase Auth** (`signInWithPassword`) plus a server-
controlled admin role (`app_metadata.role === 'admin'`). The role is only
writable with the service role key, so a regular signed-up player cannot
promote themselves.

## Status

- ✅ Frontend shipped on this branch — login, logout, session refresh,
  redirect-when-not-admin all work.
- ✅ TypeScript build passes; manual verification done in dev.
- ⚠️ **Two server-side follow-ups required before this is fully secure** —
  see "What's still required" below. Until those land, the puzzle tables
  remain protected only by the existing `CMS_SECRET` shared secret (same
  posture as before — no regression).

## What you (product/ops) need to do

### 1. Provision the first admin user

In the Supabase dashboard:

1. **Auth → Users → Invite user** with the editor's e-mail.
2. **SQL editor** — promote them to admin:
   ```sql
   update auth.users
   set raw_app_meta_data = jsonb_set(
     coalesce(raw_app_meta_data, '{}'::jsonb),
     '{role}', '"admin"'::jsonb
   )
   where email = 'editor@watson.ch';
   ```
3. The editor signs in at watson-spiele via the footer **Admin** link, using
   the password they set during invitation.

Repeat per editor. To revoke admin access: either delete the user, or set
the role back to anything other than `'admin'`.

### 2. Tell editors the password is no longer shared

Previously every editor used the same `'letsplayagame'` password. Now each
editor has their own e-mail + password. **Stop sharing the old credentials**
— they no longer work.

### 3. Schedule the two server-side follow-ups

These are documented in detail in
[`docs/admin-auth-rls.md`](./admin-auth-rls.md) for the engineer who picks
them up. Summary for prioritisation:

| # | Item | Why it matters | Effort |
|---|---|---|---|
| **A** | RLS on `verbindige_editions` | **Highest** — that table is currently writable client-side via the anon key. Anyone with the public site URL can write to it today. | ~1 hour |
| **B** | RLS on the puzzle tables (`puzzles` + each game-specific child) | Defence in depth. Shared secret today still works; this closes it from a second angle. | ~2 hours |
| **C** | Cut `cms-mutate` Edge Function over to JWT verification, drop `VITE_CMS_SECRET` | Removes the last shared secret from the JS bundle. | ~3 hours |

A → B → C is the recommended order. A is the only one that closes a
*currently exploitable* hole.

## Risks and rollback

- **If something is wrong with the new login**: revert the branch. The old
  hardcoded gate comes back, editors keep working, no data loss.
- **If we forget to provision an admin user before deploy**: editors can't
  log in to the admin area. Fix forward by running step 1 above; no rollback
  needed.
- **Sessions persist across reloads** (Supabase stores them in
  localStorage). Editors stay logged in until they explicitly hit Logout or
  the session expires (~1 hour for the access token, auto-refreshed).

## Open questions for product

1. **Magic link vs password?** Player accounts use magic-link (no
  password). We chose password for admin so it works without inbox access
  during a deploy crunch. Happy to switch to magic-link if you prefer the
  consistency — same UI, smaller change.
2. **Do we want an "Admin" user list page?** Right now provisioning is via
  SQL. A simple UI (list users with a role, toggle admin on/off) is a
  ~half-day add if it's worth the maintenance.
3. **Audit log?** No write history is captured today (intentionally minimal
  — see `cms-mutate` notes). Worth adding once we have multiple editors?
