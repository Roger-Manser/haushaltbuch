/* Haushaltbuch Service Worker – GitHub Pages optimiert
   Läuft unter: /haushaltbuch/
*/

const CACHE_NAME = 'haushaltbuch-v197';

// Alle statischen Dateien, die für Offline-Betrieb nötig sind
const SHELL = [
  '/haushaltbuch/',
  '/haushaltbuch/index.html',
  '/haushaltbuch/manifest.json',

  // Icons
  '/haushaltbuch/icons/icon-192x192.png',
  '/haushaltbuch/icons/icon-192x192-maskable.png',
  '/haushaltbuch/icons/icon-512x512.png',
  '/haushaltbuch/icons/icon-512x512-maskable.png'
];

console.log('[SW] Loading Service Worker', CACHE_NAME);

self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching shell', SHELL);
        return cache.addAll(SHELL);
      })
      .then(() => {
        console.log('[SW] Shell cached, skipWaiting');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Install error', err);
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys()
      .then(keys => {
        const old = keys.filter(k => k !== CACHE_NAME);
        if (old.length) {
          console.log('[SW] Deleting old caches', old);
        }
        return Promise.all(old.map(k => caches.delete(k)));
      })
      .then(() => {
        console.log('[SW] Clients claim');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const pathname = url.pathname;

  // Start-URL / App-Shell erkennen
  const isShell =
    pathname === '/haushaltbuch' ||
    pathname === '/haushaltbuch/' ||
    pathname === '/haushaltbuch/index.html';

  if (isShell) {
    // NETWORK-FIRST mit Fallback auf Cache + index.html
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
            return res;
          }
          return caches.match(req)
            .then(cached => cached || caches.match('/haushaltbuch/index.html'));
        })
        .catch(() => {
          console.log('[SW] Network failed, using cache for', pathname);
          return caches.match(req)
            .then(cached => cached || caches.match('/haushaltbuch/index.html'));
        })
    );
  } else {
    // CACHE-FIRST für alle anderen Assets
    event.respondWith(
      caches.match(req)
        .then(cached => {
          if (cached) {
            return cached;
          }
          return fetch(req)
            .then(res => {
              if (res && res.status === 200) {
                const copy = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
              }
              return res;
            })
            .catch(err => {
              console.error('[SW] Fetch failed', pathname, err);
              return new Response('', { status: 503, statusText: 'Offline' });
            });
        })
    );
  }
});

console.log('[SW] Ready', CACHE_NAME);
