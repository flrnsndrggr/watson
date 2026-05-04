Subject: watson Spiele — admin auth migrated to real accounts (action needed: editor list)

Hi team,

Heads-up on a security cleanup that's now live on watson-spiele, and one
small thing I need from you.

**What changed**

The `/admin` editor used to be gated by a single shared password
(`letsplayagame`) that was visible to anyone who opened devtools. The
backend Edge Function had the same problem with a matching shared secret,
and the branded-editions table allowed any logged-in player to write to
it. All three holes are now closed.

**The new flow** — same as the player login:

1. Click "Anmelden" in the header (or "Admin" in the footer — they do the
   same thing now).
2. Enter your email → click the magic link in your inbox.
3. If your account has been granted admin access, an "Admin" chip
   appears in the header. Click it to enter the editor.

There is no password and no shared secret anywhere. Admin status is set
server-side per account (`app_metadata.role = 'admin'`) and can only be
written with the service-role key, so a regular signed-up player cannot
promote themselves.

**What I need from you**

**Send me a list of editor email addresses.** For each one, I'll grant
admin access in Supabase. Two cases:

- If they already use watson-spiele as a player (already signed up via
  magic-link), promotion is instant — they'll see the Admin chip on
  their next sign-in.
- If they don't have an account yet, they sign up via the regular
  Anmelden flow first; ping me and I'll promote them. Or I can invite
  them from the Supabase dashboard, which sends a sign-up email.

**Stop sharing the old password.** `letsplayagame` no longer works —
anyone who tries it gets a generic "invalid credentials" error.

**What's already shipped (no action from you)**

- Magic-link admin login replacing the shared password.
- The Edge Function (`cms-mutate`) verifies the caller's identity and
  rejects anyone whose role isn't `admin`.
- Row-level security on the puzzle tables and the editions table —
  admin-only writes, defence-in-depth on top of the Edge Function.
- First admin (me) provisioned and verified end-to-end.

**One open question**

We currently manage the admin list via SQL — me running an `update` per
editor. Fine for a fixed team of 2–5. If editor turnover is high or you
want to manage admins yourselves without me in the loop, I can ship a
small admin-user-management UI (~half a day). Worth doing now or later?

Happy to walk through any of this on a call.

Thanks,
F
