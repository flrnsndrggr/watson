/**
 * Web Push subscription pipeline.
 *
 * Designed to be account-agnostic so it can be docked to a future
 * watson.ch SSO with no schema break:
 *
 * - Subscriptions can exist without a Supabase user_id (anon browsers
 *   that opted in pre-signup). When the user signs in, we call
 *   `link_push_subscription_to_user` to attach the row.
 * - The DB table reserves `external_user_id` + `account_provider` for
 *   the watson.ch case. The send-side dispatcher will be able to query
 *   by either id without a migration.
 *
 * The SW receives pushes via the `push` event handler in public/sw.js.
 */
import { supabase } from '@/lib/supabase';
import { logEvent } from '@/lib/events';

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? '';

export interface PushSubscriptionStatus {
  /** Browser supports the Push API at all. */
  supported: boolean;
  /** OS-level permission ('default' = not yet asked). */
  permission: NotificationPermission;
  /** A real subscription is registered for this browser. */
  subscribed: boolean;
}

export async function getPushStatus(): Promise<PushSubscriptionStatus> {
  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;
  if (!supported) {
    return { supported: false, permission: 'default', subscribed: false };
  }
  let subscribed = false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    subscribed = !!sub;
  } catch {
    subscribed = false;
  }
  return {
    supported: true,
    permission: Notification.permission,
    subscribed,
  };
}

/**
 * Idempotent subscribe. Returns the existing subscription if one is
 * already registered with the same VAPID key, otherwise creates a new
 * one. Always upserts the resulting endpoint to Supabase.
 *
 * @param reminderHour Hour of the day (0–23, Europe/Zurich) when the
 *   send-side dispatcher should target this subscription.
 */
export async function subscribeToPush(
  reminderHour: number = 8,
): Promise<{ ok: true; endpoint: string } | { ok: false; reason: string }> {
  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, reason: 'VAPID_PUBLIC_KEY not configured' };
  }
  const status = await getPushStatus();
  if (!status.supported) {
    return { ok: false, reason: 'Browser does not support Web Push' };
  }

  // Permission must be granted before subscribe(). Trigger the prompt if
  // it's still 'default'.
  let permission = status.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    void logEvent('push_permission_denied');
    return { ok: false, reason: 'Permission not granted' };
  }

  let reg: ServiceWorkerRegistration;
  try {
    reg = await navigator.serviceWorker.ready;
  } catch {
    return { ok: false, reason: 'Service worker not ready' };
  }

  // Re-use the existing PushSubscription if present, otherwise create one.
  // Browsers persist the subscription across sessions until explicitly
  // unsubscribed, so on returning visits this is a no-op cheap call.
  let sub: PushSubscription | null;
  try {
    sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // Cast: TS lib.dom typings tighten BufferSource since 5.4 to require
        // ArrayBuffer (not ArrayBufferLike). Web Push spec accepts a plain
        // Uint8Array; the cast bridges the typing without runtime change.
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });
    }
  } catch (e) {
    return { ok: false, reason: `subscribe failed: ${String(e)}` };
  }

  await persistSubscription(sub, reminderHour);
  void logEvent('push_subscribed', {
    payload: { reminder_hour: reminderHour },
  });
  return { ok: true, endpoint: sub.endpoint };
}

/** Tear down both the browser-level subscription and the server row. */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    // Delete server row (authed users have RLS perm; anon rows fall through).
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    void logEvent('push_unsubscribed');
  } catch {
    // non-critical
  }
}

/** Update reminder_hour on the existing server row. No-op if not subscribed. */
export async function updateReminderHour(hour: number): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await persistSubscription(sub, hour);
    void logEvent('push_reminder_hour_changed', { payload: { hour } });
  } catch {
    // ignore
  }
}

/**
 * On sign-in, link any existing anonymous subscription on this device to
 * the freshly authenticated user. Called from the auth provider.
 */
export async function linkPushSubscriptionOnLogin(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await supabase.rpc('link_push_subscription_to_user', { p_endpoint: sub.endpoint });
    void logEvent('push_subscription_linked');
  } catch {
    // ignore
  }
}

// ---- internals ----

/**
 * Upsert the subscription on the server. Routes through one of two paths
 * so anonymous subscriptions (no auth.uid) still land in the table:
 *
 * - authed: direct upsert via the RLS-protected table (auth.uid wins)
 * - anon:   RPC `upsert_anon_push_subscription` (SECURITY DEFINER)
 */
async function persistSubscription(
  sub: PushSubscription,
  reminderHour: number,
): Promise<void> {
  const json = sub.toJSON() as { keys?: { p256dh?: string; auth?: string } };
  const p256dh = json.keys?.p256dh ?? '';
  const auth = json.keys?.auth ?? '';
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : null;
  const hour = clamp(reminderHour, 0, 23);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          account_provider: 'supabase',
          endpoint: sub.endpoint,
          p256dh_key: p256dh,
          auth_key: auth,
          user_agent: ua,
          reminder_hour: hour,
          enabled: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' },
      );
      return;
    }
    await supabase.rpc('upsert_anon_push_subscription', {
      p_endpoint: sub.endpoint,
      p_p256dh: p256dh,
      p_auth: auth,
      p_user_agent: ua,
      p_reminder_hour: hour,
    });
  } catch {
    // non-critical — the browser-level sub still works for anything
    // that bypasses the server (debug pushes from a future inspector).
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n | 0));
}

/** Convert URL-safe base64 VAPID key to Uint8Array for subscribe(). */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const padded = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
