// Minimal service worker — exists so the browser considers the site
// "installable" as a PWA. We deliberately do not cache app shell here
// because the rebuild's index.html and JS bundles change every deploy
// and we want sisters to always see the latest version. If you want
// offline support later, add a cache strategy here.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Pass-through. The browser handles all requests as normal.
});
