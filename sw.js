const CACHE = 'haushaltbuch-v98';
const ASSETS = [
  './index.html',
  './manifest.json?v=10',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all(ASSETS.map(url =>
        fetch(url, { cache: 'no-cache' }).then(res => {
          if (res && res.ok) return cache.put(url, res);
        }).catch(() => {})
      ))
    )
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Lass alle cross-origin Anfragen (GitHub API, CDNs, etc.) immer direkt ans Netz
  if (url.origin !== self.location.origin) return;

  // Navigation: Network-first
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone())).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Same-origin statische Dateien: Cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        caches.open(CACHE).then(c => c.put(e.request, res.clone())).catch(() => {});
        return res;
      }).catch(() => cached);
    })
  );
});
