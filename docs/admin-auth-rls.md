# Admin auth migration — RLS policies and follow-ups

The shared client-side admin password (`'letsplayagame'`) was replaced with
real Supabase auth: `supabase.auth.signInWithPassword`, gated on
`user.app_metadata.role === 'admin'`. This document records the **server-side
work that must follow** to actually close the trust boundary. None of the
SQL below has been applied — review and create a migration.

## 1. Provision admin users

`app_metadata` is only writable with the service role key, so a regular
signed-in user cannot promote themselves. Create the admin account in the
Supabase dashboard (Auth → Users → Invite user), then via the SQL editor:

```sql
update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{role}', '"admin"'::jsonb
)
where email = 'admin@example.com';
```

After the next sign-in the JWT will carry `app_metadata.role = 'admin'`,
which the frontend's `useAuth().isAdmin` reads.

## 2. RLS on puzzle tables

Today the puzzle tables already have date-based RLS for *reads* by anonymous
users (only past/present `publish_date` is visible), and writes go through
the `cms-mutate` Edge Function with a shared `CMS_SECRET`. Once
admin-as-real-user is in place, write policies should require an
authenticated admin so the shared secret can be retired (see §4).

Tables to cover:

- `puzzles` (parent)
- `verbindige_puzzles`
- `zaemesetzli_puzzles`
- `schlagloch_puzzles`
- `quizzhuber_puzzles`
- `aufgedeckt_puzzles`
- `quizzticle_puzzles`
- `verbindige_editions` ← currently writable client-side via anon key, see §3

A reusable predicate keeps the policies readable:

```sql
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;
```

Per-table pattern (apply to each puzzle table):

```sql
alter table puzzles enable row level security;

drop policy if exists "Admins write puzzles" on puzzles;
create policy "Admins write puzzles"
  on puzzles for all
  using (public.is_admin())
  with check (public.is_admin());

-- Keep the existing public-read policy (date-gated). Example:
drop policy if exists "Public read published puzzles" on puzzles;
create policy "Public read published puzzles"
  on puzzles for select
  using (publish_date <= (now() at time zone 'Europe/Zurich')::date);
```

Repeat the `Admins write …` policy on each game-specific child table.
Reads on the children today join via the parent `puzzles` row, so a parallel
public-read policy on each child is also needed if not already present.

## 3. `verbindige_editions` — currently unprotected

`src/lib/supabase.ts` calls `upsertEdition()` and `deleteEdition()`
**directly** with the anon key, bypassing the Edge Function. Without RLS,
anyone with the anon key (which ships in every page load) can write to this
table today.

```sql
alter table verbindige_editions enable row level security;

drop policy if exists "Public read published editions" on verbindige_editions;
create policy "Public read published editions"
  on verbindige_editions for select
  using (status = 'published');

drop policy if exists "Admins read all editions" on verbindige_editions;
create policy "Admins read all editions"
  on verbindige_editions for select
  using (public.is_admin());

drop policy if exists "Admins write editions" on verbindige_editions;
create policy "Admins write editions"
  on verbindige_editions for all
  using (public.is_admin())
  with check (public.is_admin());
```

This is the highest-priority follow-up — it's the one path where the new
admin login alone is **not** sufficient to close the hole. RLS is required.

## 4. `cms-mutate` Edge Function — replace shared secret with JWT

`supabase/functions/cms-mutate/index.ts` currently authorizes by comparing
the `x-cms-secret` header against `CMS_SECRET`. The matching value ships in
the JS bundle as `VITE_CMS_SECRET`, so anyone reading the bundle has full
write access — no better than the old hardcoded password.

Replace the secret check with JWT verification:

```ts
// Read the caller's JWT from the Authorization header. Use anon key + the
// caller's token (NOT the service role) to verify identity, then fall back
// to a service-role admin client for the actual writes.
const authHeader = req.headers.get('authorization') ?? '';
const userClient = createClient(SUPABASE_URL, ANON_KEY, {
  global: { headers: { Authorization: authHeader } },
});
const { data: { user }, error: userErr } = await userClient.auth.getUser();
if (userErr || !user || (user.app_metadata as any)?.role !== 'admin') {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
// `admin` (service-role) client used for writes is unchanged.
```

Then in `src/lib/cmsApi.ts`:

- Drop `VITE_CMS_SECRET` and the `x-cms-secret` header.
- Send the user's session token: `Authorization: Bearer ${session.access_token}`
  (read via `supabase.auth.getSession()`).

After this lands, `VITE_CMS_SECRET` and `CMS_SECRET` can be removed from the
build env and Edge Function secrets respectively.

## Order of operations

1. Provision the admin user (§1) so login works against staging.
2. Land the RLS policies (§2 + §3) — the `verbindige_editions` policy is the
   one that closes a real hole today.
3. Cut the Edge Function over to JWT (§4) and drop `VITE_CMS_SECRET`.

Steps 1–2 are independent of the frontend changes already shipped; step 3
requires the admin-auth frontend (already shipped) so the cmsApi caller has
a session token to send.
