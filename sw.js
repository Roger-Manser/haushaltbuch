const CACHE = 'haushaltbuch-v158';
const ASSETS = [
  './index.html',
  './manifest.json?v=10',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
];

// Install: alle Assets in Cache laden, SW wartet bis alle da sind
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(ASSETS.map(url =>
        fetch(url, { cache: 'no-store' })
          .then(res => { if (res && res.ok) return cache.put(url, res); })
          .catch(() => {/* Icon fehlt ggf. – nicht kritisch */})
      ))
    ).then(() => self.skipWaiting()) // sofort aktivieren
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Activate: alte Caches löschen, sofort übernehmen
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch-Strategie:
//   - Cross-origin (API, CDN): immer Netz, kein Cache
//   - index.html (Navigation): Cache-first mit Hintergrund-Refresh (Stale-While-Revalidate)
//   - Andere same-origin Dateien: Cache-first, Netz als Fallback
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Cross-origin: nicht cachen (GitHub API, Anthropic, OFF, CDNs)
  if (url.origin !== self.location.origin) return;

  // index.html / Navigation: Cache sofort ausliefern, im Hintergrund aktualisieren
  if (e.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/haushaltbuch/' || url.pathname === '/haushaltbuch') {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match('./index.html');
        const fetchPromise = fetch(e.request, { cache: 'no-store' })
          .then(res => {
            if (res && res.ok) cache.put('./index.html', res.clone());
            return res;
          })
          .catch(() => null);

        // Online: Netz bevorzugen mit kurzer Wartezeit, Fallback auf Cache
        if (navigator.onLine) {
          try {
            const fresh = await Promise.race([
              fetchPromise,
              new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000))
            ]);
            if (fresh && fresh.ok) return fresh;
          } catch (_) {}
        }

        // Offline oder Timeout: aus Cache
        return cached || fetch(e.request).catch(() => cached);
      })
    );
    return;
  }

  // Statische Dateien (Icons, Manifest): Cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // Im Hintergrund aktualisieren
        fetch(e.request, { cache: 'no-store' })
          .then(res => { if (res && res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone())); })
          .catch(() => {});
        return cached;
      }
      return fetch(e.request)
        .then(res => {
          if (res && res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone())).catch(() => {});
          return res;
        })
        .catch(() => cached);
    })
  );
});
