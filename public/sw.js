importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

workbox.setConfig({
  debug: false
});

const {strategies} = workbox;
const {registerRoute} = workbox.routing;
const {precacheAndRoute} = workbox.precaching;
const {ExpirationPlugin} = workbox.expiration;
const {CacheableResponsePlugin} = workbox.cacheableResponse;

precacheAndRoute([
  { url: '/', revision: '1' },
  { url: '/index.html', revision: '1' },
  { url: '/scripts/index.js', revision: '1' },
  { url: '/styles/styles.css', revision: '1' },
  { url: '/styles/story.css', revision: '1' },
  { url: '/styles/home.css', revision: '1' },
  { url: '/styles/auth.css', revision: '1' },
  { url: '/styles/transitions.css', revision: '1' },
  { url: '/favicon.png', revision: '1' },
  { url: '/manifest.json', revision: '1' },
  { url: '/icons/android/android-launchericon-72-72.png', revision: '1' },
  { url: '/icons/android/android-launchericon-96-96.png', revision: '1' },
  { url: '/icons/android/android-launchericon-144-144.png', revision: '1' },
  { url: '/icons/android/android-launchericon-192-192.png', revision: '1' },
  { url: '/icons/android/android-launchericon-512-512.png', revision: '1' }
]);

registerRoute(
  ({request}) => request.destination === 'style' ||
                request.destination === 'script' ||
                request.destination === 'worker',
  new strategies.CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

registerRoute(
  ({request}) => request.destination === 'image',
  new strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

registerRoute(
  ({url}) => url.pathname.startsWith('/api') || url.href.includes('dicoding.dev'),
  new strategies.NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60,
      }),
    ],
  })
);

registerRoute(
  ({request}) => request.mode === 'navigate',
  new strategies.NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

self.addEventListener('push', (event) => {
  let body;
  
  if (event.data) {
    body = event.data.text();
  } else {
    body = 'Push message no payload';
  }
  
  const options = {
    body: body,
    icon: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Story App Notification', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

self.addEventListener('online', () => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'ONLINE_STATUS',
        isOnline: true
      });
    });
  });
});

self.addEventListener('offline', () => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'ONLINE_STATUS',
        isOnline: false
      });
    });
  });
});