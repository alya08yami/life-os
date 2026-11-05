/* LIFE OS service worker. Generated at build time by scripts/finalize-web.cjs — do not edit dist copies.
 *
 * What it does:
 *  - keeps a copy of the app's own files (HTML, JS, fonts, icons, bundled pictures) so the installed app can start
 *    without internet;
 *  - always asks the network first for the page itself, so a newly published version is picked up on the next
 *    launch; the cached copy is used only when the network is unavailable or too slow;
 *  - removes caches of older versions (it keeps the previous one for pages that are still open).
 * What it never does:
 *  - touch IndexedDB or localStorage — records, photos and settings are not stored or deleted here;
 *  - handle requests to other sites (TMDB catalog Worker, image.tmdb.org, maps…): those go straight to the network;
 *  - cache anything that is not a public file of the app.
 */
const BUILD = '__BUILD__';
const BASE = '__BASE__';
const PRECACHE = __PRECACHE__;
const PREFIX = 'life-os-app-';
const CACHE = PREFIX + BUILD;
const SHELL = BASE + '/';
const NETWORK_TIMEOUT = 4000;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Best effort per file: one missing picture must not block the update.
    await Promise.all(PRECACHE.map(url => fetch(url, {cache: 'reload'}).then(r => r.ok ? cache.put(url, r) : undefined).catch(() => undefined)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = (await caches.keys()).filter(k => k.startsWith(PREFIX));
    const meta = await Promise.all(keys.map(async k => {
      const r = await (await caches.open(k)).match('__created__');
      return {k, t: r ? Number(await r.text()) : 0};
    }));
    await (await caches.open(CACHE)).put('__created__', new Response(String(Date.now())));
    const older = meta.filter(m => m.k !== CACHE).sort((a, b) => b.t - a.t);
    await Promise.all(older.slice(1).map(m => caches.delete(m.k)));
    await self.clients.claim();
  })());
});

const timeout = ms => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !(url.pathname === BASE || url.pathname.startsWith(BASE + '/'))) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await Promise.race([fetch(request, {cache: 'no-cache'}), timeout(NETWORK_TIMEOUT)]);
        // GitHub Pages answers inner routes with 404.html (status 404) — it is the same app shell.
        if ((response.ok || response.status === 404) && (response.headers.get('content-type') || '').includes('text/html')) {
          cache.put(SHELL, response.clone()).catch(() => {});
        }
        return response;
      } catch {
        return (await cache.match(SHELL)) || (await caches.match(SHELL)) || Response.error();
      }
    })());
    return;
  }

  // Hashed build files never change under the same name: cache first.
  const immutable = /\/_expo\/static\/|\/assets\/.+\.[0-9a-f]{20,}\./.test(url.pathname);
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (immutable) {
      const hit = await caches.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    }
    // Manifest, icons and other unhashed files: network first, cached copy offline.
    try {
      const response = await fetch(request, {cache: 'no-cache'});
      if (response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch {
      return (await caches.match(request)) || Response.error();
    }
  })());
});
