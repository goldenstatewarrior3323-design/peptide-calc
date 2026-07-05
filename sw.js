const CACHE = 'peptide-calc-v3'; // bumped — forces old cached copies (including stale meal-tracker.html) to be deleted
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const HTML_EXT = /\.html$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Network-first for HTML pages: always try to get the latest version first,
  // so a code update shows up on next load instead of being silently masked by
  // a stale cached copy. Falls back to cache only if offline.
  if (HTML_EXT.test(url.pathname)) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  // Cache-first for static assets (icons, manifest) — these rarely change, fine to serve from cache
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
