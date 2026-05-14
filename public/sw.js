// Service Worker for Push Notifications - Hijrah Toko
// This runs in a separate thread and handles push events even when the page is closed.

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Hijrah Toko',
      body: event.data.text(),
      icon: '/assets/images/logo-hijrah-toko.png',
    };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/assets/images/logo-hijrah-toko.png',
    badge: '/assets/images/logo-hijrah-toko.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'hijrah-toko-notification',
    renotify: true,
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Hijrah Toko', options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});
