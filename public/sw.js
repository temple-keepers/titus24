// Service worker for Titus 2:4. We deliberately do not cache app shell
// here because the rebuild's index.html and JS bundles change every
// deploy and we want sisters to always see the latest version. The
// install/activate handlers below give the browser PWA-installability
// and the push handler delivers web-push notifications.

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
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = {
        title: parsed.title ?? payload.title,
        body: parsed.body ?? payload.body,
        link: parsed.link ?? '/',
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
      data: { link: payload.link },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(link);
    })
  );
});
