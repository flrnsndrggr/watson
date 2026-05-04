Subject: watson Spiele — Admin login is changing (action needed before next deploy)

Hi team,

Quick heads-up on a change to how /admin works on watson-spiele, and two
small things I need from you.

**What's changing**

Until now, every editor used the same shared password to get into /admin
(`letsplayagame`). That password was visible to anyone who opened devtools
on the site — not really a secret. I've replaced it with proper Supabase
accounts: each editor signs in with their own e-mail and password, and an
"admin" role on their account unlocks the editor.

Functionally nothing about the editor UI changes — same dashboards, same
flows. The only difference is the login screen now asks for an e-mail
instead of a username.

**What I need from you**

1. **A list of who needs admin access.** Send me the e-mail addresses of
   anyone on the team who should be able to edit puzzles. I'll provision
   them in Supabase and they'll get an invitation e-mail to set a password.

2. **Stop sharing the old password.** Once we deploy, `letsplayagame` no
   longer works. Anyone who tries it will just see a generic "invalid
   credentials" error.

**Two follow-ups on my end**

There are two server-side hardening steps still to land — most importantly,
locking down direct writes to the branded `verbindige_editions` table and
retiring the last shared secret from the bundle. I've documented both in
the repo (docs/admin-auth-rls.md) and I'll schedule them for the next
sprint. The login change shipping now is independent of those — no regression
vs. today, and it's the prerequisite for the rest.

Happy to walk through any of this on a call. Two small open questions where
your input would help:

- **Magic-link vs password for admin login** — I went with password for
  speed, but we could match the player flow (e-mail-only magic links) if
  you'd prefer the consistency. Small change either way.
- **Self-serve admin user management** — currently I add/remove admins via
  SQL. Worth building a tiny UI for it, or fine to keep it as an engineer
  task for now?

Let me know on (1) and (2) above when you have a sec — I'd like to deploy
this in the next couple of days.

Thanks,
F
