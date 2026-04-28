/// <reference lib="webworker" />

// -------------------------------------------------------
// watson Spiele — Service Worker (offline-first PWA)
// -------------------------------------------------------
// Strategy overview:
//   App shell (HTML/JS/CSS)   → cache-first, refresh in background
//   Supabase API (puzzles)    → network-first, fall back to cache
//   Google Fonts / static     → cache-first (long-lived)
// -------------------------------------------------------

// Bump both versions on every deploy that changes behaviour — the activate
// handler nukes any cache whose name doesn't match and returning players
// immediately pull the fresh shell. v2 = Schlagziil -> Schlagloch rename.
// v3 = supabase puzzle fetch fix (puzzle_id -> id) so users with the v2 cache
// pick up the corrected JS bundle that actually loads today's DB puzzles.
// v4 = web push handlers (push + notificationclick) — bump so existing SWs
// install the new handlers on next visit.
// v5 = schlagloch reveal fix (DB-derived display answers) — without bump,
// users with a v4 SW keep showing seed answers on lost-game review.
const CACHE_VERSION = 'watson-v5-schlagloch-reveal-fix';
const API_CACHE = 'watson-api-v5-schlagloch-reveal-fix';

// Minimal app-shell URLs cached on install.
// Vite hashed assets are cached at runtime via fetch handler.
const APP_SHELL = ['/', '/favicon.svg', '/manifest.json'];

// ----- Install: pre-cache app shell -----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ----- Activate: clean old caches -----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ----- Fetch: routing by request type -----
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  // Supabase REST API → network-first (cache puzzle data for offline)
  if (url.hostname.includes('supabase')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // Google Fonts → cache-first (immutable)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, CACHE_VERSION));
    return;
  }

  // Same-origin assets → stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, CACHE_VERSION));
    return;
  }
});

// ----- Caching strategies -----

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ----- Web Push -----
//
// Payload contract (sent by the dispatcher):
//   { title, body, url?, tag? }
// `url` is opened on click; `tag` collapses duplicate notifications.

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'watson Spiele', body: event.data.text() };
  }
  const {
    title = 'watson Spiele',
    body = 'Heutige Rätsel warten.',
    url = '/',
    tag,
  } = payload || {};
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: '/icons.svg',
      badge: '/favicon.svg',
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus an existing tab on the same origin if one is open.
        for (const client of clients) {
          if ('focus' in client && client.url.startsWith(self.location.origin)) {
            return client.focus().then(() => {
              if ('navigate' in client) client.navigate(url);
            });
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
