// Service worker for Titus 2:4. We deliberately do not cache app shell
// here because the rebuild's index.html and JS bundles change every
// deploy and we want sisters to always see the latest version. The
// install/activate handlers below give the browser PWA-installability,
// and the push + notificationclick handlers handle inbound web-push
// and the deep-link route on tap.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Pass-through. The browser handles all requests as normal.
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Titus 2:4',
    body: 'Something new is waiting for you.',
    link: '/',
    tag: undefined,
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = {
        title: parsed.title ?? payload.title,
        body: parsed.body ?? payload.body,
        link: parsed.link ?? '/',
        tag: parsed.tag,
      };
    }
  } catch (e) {
    // Ignore parse failures and fall back to defaults.
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/logo.png',
      badge: '/logo.png',
      // tag dedupes successive pings to the same conversation/post:
      // a second message in the same chat replaces the first.
      tag: payload.tag,
      renotify: !!payload.tag,
      data: { link: payload.link },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(async (clientList) => {
        // Prefer a same-origin client that's already open. If we find one,
        // postMessage so the React app can do a soft client-side
        // navigation instead of a full document reload (preserves auth
        // state, scroll, realtime channels, etc.). Then focus.
        const ours = clientList.filter((c) => {
          try {
            return new URL(c.url).origin === self.location.origin;
          } catch (_) {
            return false;
          }
        });

        for (const client of ours) {
          client.postMessage({ type: 'navigate', link });
          if ('focus' in client) {
            try {
              return await client.focus();
            } catch (_) {
              // ignore and continue
            }
          }
        }

        // No client open — open a new window directly at the link so the
        // sister lands on the right screen, not the home page.
        if (self.clients.openWindow) {
          return self.clients.openWindow(link);
        }
      })
  );
});
