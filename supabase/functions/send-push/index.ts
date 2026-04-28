// supabase/functions/send-push/index.ts
//
// Web Push dispatcher. POST a payload + a target identifier; the function
// looks up matching push_subscriptions rows and signs+sends VAPID-encrypted
// pushes to each endpoint. Designed to accept either a Supabase user_id or
// a future watson.ch external_user_id without a contract change.
//
// Env (set via `supabase secrets set` or the dashboard):
//   VAPID_PUBLIC_KEY   — same as the client's VITE_VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY  — never exposed to the client
//   VAPID_SUBJECT      — mailto:… or https://… contact for the push provider
//
// Request body:
//   {
//     "target": { "user_id": "uuid" }              // Supabase user
//       | { "external_user_id": "string" }         // watson.ch user
//       | { "endpoint": "https://…" }              // raw subscription
//       | { "all_with_reminder_hour": 8 },         // dispatcher / cron
//     "payload": { "title": "…", "body": "…", "url": "/", "tag": "…" }
//   }
//
// Returns { sent: number, failed: number, retired: number } where
// `retired` counts subscriptions that returned 404/410 and were deleted.
//
// This is a thin wrapper — it does NOT decide *whether* to send (e.g.
// "user already played today"). The caller / cron decides eligibility.

// @ts-nocheck — Deno runtime, not the project's tsconfig.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as webpush from 'https://esm.sh/web-push@3.6.7?bundle';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:flrn.sndrggr@gmail.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface SubRow {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

async function findTargets(target: Record<string, unknown>): Promise<SubRow[]> {
  let query = admin
    .from('push_subscriptions')
    .select('endpoint, p256dh_key, auth_key')
    .eq('enabled', true);

  if ('user_id' in target && target.user_id) {
    query = query.eq('user_id', target.user_id);
  } else if ('external_user_id' in target && target.external_user_id) {
    query = query.eq('external_user_id', target.external_user_id);
  } else if ('endpoint' in target && target.endpoint) {
    query = query.eq('endpoint', target.endpoint);
  } else if ('all_with_reminder_hour' in target) {
    query = query.eq('reminder_hour', target.all_with_reminder_hour);
  } else {
    throw new Error('Invalid target');
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  const { target, payload } = body ?? {};
  if (!target || !payload) {
    return new Response('target and payload required', { status: 400 });
  }

  let subs: SubRow[];
  try {
    subs = await findTargets(target);
  } catch (e) {
    return new Response(`Target lookup failed: ${e}`, { status: 400 });
  }

  let sent = 0;
  let failed = 0;
  const retiredEndpoints: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
          },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 6 },
        );
        sent++;
      } catch (e: unknown) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          retiredEndpoints.push(sub.endpoint);
        } else {
          failed++;
        }
      }
    }),
  );

  if (retiredEndpoints.length > 0) {
    await admin
      .from('push_subscriptions')
      .delete()
      .in('endpoint', retiredEndpoints);
  }

  return new Response(
    JSON.stringify({
      sent,
      failed,
      retired: retiredEndpoints.length,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
