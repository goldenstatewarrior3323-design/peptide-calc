// Minimal service worker — required by some browsers for the "Install app"
// prompt to appear. Does not cache anything; every request just passes through.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
