// Service Worker for Push Notifications
// This file handles push events and notification clicks

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    if (!event.data) {
        console.log('[Service Worker] No data.');
        return;
    }

    const data = event.data.json();
    console.log('[Service Worker] Data:', data);

    const title = data.title || 'Fanbroj';
    const options = {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        image: data.image || null,
        badge: data.badge || '/badge-72.png',
        data: {
            url: data.url || '/',
        },
        vibrate: [200, 100, 200],
        tag: 'fanbroj-notification',
        requireInteraction: false,
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                // Check if there's already a window open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if none found
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Optional: Handle service worker installation
self.addEventListener('install', function (event) {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(clients.claim());
});
