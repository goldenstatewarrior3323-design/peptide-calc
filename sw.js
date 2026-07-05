const CACHE = 'peptide-calc-v4'; // bumped again — purges any bad cache entries from the v3 fallback bug
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
  // a stale cached copy. On failure, fall back ONLY to that same page's own cached
  // copy — never to a different app's page. If this exact page was never
  // successfully cached, let the request fail naturally rather than silently
  // substituting a different app's content.
  if (HTML_EXT.test(url.pathname)) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first for static assets (icons, manifest) — these rarely change, fine to serve from cache.
  // On a cache miss AND network failure, do NOT substitute a different app's file —
  // just let the request fail naturally so the browser shows its own real error
  // instead of silently swapping in the wrong app's icon/manifest.
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
