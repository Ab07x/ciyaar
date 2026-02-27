// Firebase Cloud Messaging Service Worker
// Must match the Firebase version used in the client app (12.8.0)

importScripts('https://www.gstatic.com/firebasejs/12.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyBkVkGdm-nP9LfNMzlFyDd9CxHWsdogfP0",
    authDomain: "fanproj-push.firebaseapp.com",
    projectId: "fanproj-push",
    storageBucket: "fanproj-push.firebasestorage.app",
    messagingSenderId: "1061582318142",
    appId: "1:1061582318142:web:aaf8d78697ec9b465fbf6f",
    measurementId: "G-1FM2LLEFNX"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message:', payload);

    const title = payload.notification?.title || payload.data?.title || 'Fanbroj';
    const options = {
        body: payload.notification?.body || payload.data?.body || '',
        icon: payload.notification?.icon || '/icon-192.png',
        badge: '/badge-72.png',
        image: payload.notification?.image || payload.data?.image || null,
        data: {
            url: payload.fcmOptions?.link || payload.data?.url || '/',
            ...payload.data
        },
        requireInteraction: true,
        vibrate: [200, 100, 200],
        tag: 'fanbroj-notification',
        renotify: true,
        actions: [
            { action: 'open', title: 'Fur' },
            { action: 'close', title: 'Xir' }
        ]
    };

    self.registration.showNotification(title, options);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';
    const baseUrl = self.location.hostname === 'localhost' ? 'https://fanbroj.net' : self.location.origin;
    const fullUrl = urlToOpen.startsWith('http') ? urlToOpen : new URL(urlToOpen, baseUrl).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === fullUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(fullUrl);
            }
        })
    );
});

// Handle push events (fallback for data-only messages)
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        if (data.notification) return;

        const title = data.title || 'Fanbroj';
        const options = {
            body: data.body || '',
            icon: data.icon || '/icon-192.png',
            badge: '/badge-72.png',
            image: data.image || null,
            data: { url: data.url || '/', ...data },
            requireInteraction: true,
            tag: 'fanbroj-notification',
        };

        event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
        console.error('[firebase-messaging-sw.js] Error parsing push data:', e);
    }
});

console.log('[firebase-messaging-sw.js] Service worker loaded (v12.8.0)');
