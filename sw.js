const CACHE = 'haushaltbuch-v23';
const ASSETS = [
  './index.html',
  './manifest.json?v=10',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache each asset independently so one missing file doesn't fail the whole install.
      return Promise.all(
        ASSETS.map(url =>
          fetch(url, { cache: 'no-cache' }).then(res => {
            if (res && res.ok) return cache.put(url, res);
          }).catch(() => {})
        )
      );
    })
  );
  // Do NOT auto-activate. Wait for the page to explicitly request the update
  // via postMessage({type:'SKIP_WAITING'}) so the user controls when the reload happens.
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Network-first for navigation/HTML so updates are picked up; cache as offline fallback.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() =>
        caches.match(e.request).then(res => res || caches.match('./index.html'))
      )
    );
    return;
  }

  // Cache-first for same-origin static assets (icons, manifest, css/js if any).
  const url = new URL(e.request.url);
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          return res;
        }).catch(() => cached);
      })
    );
  }
  // Cross-origin requests (GitHub API, Open Food Facts, ZXing CDN, etc.) go straight to network.
});
