importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

if (workbox) {
  console.log("Workbox loaded successfully");

  workbox.setConfig({
    debug: false,
  });

  const { strategies } = workbox;
  const { registerRoute } = workbox.routing;
  const { precacheAndRoute } = workbox.precaching;
  const { ExpirationPlugin } = workbox.expiration;
  const { CacheableResponsePlugin } = workbox.cacheableResponse;

  // Precache core app shell
  const precacheManifest = [
    { url: "/", revision: "1" },
    { url: "/index.html", revision: "1" },
    { url: "/favicon.png", revision: "1" },
    { url: "/manifest.json", revision: "1" },
    // CSS files with absolute paths
    { url: "/styles/styles.css", revision: "1" },
    { url: "/styles/story.css", revision: "1" },
    { url: "/styles/home.css", revision: "1" },
    { url: "/styles/auth.css", revision: "1" },
    { url: "/styles/transitions.css", revision: "1" },
    // Icons
    { url: "/icons/icon-72x72.png", revision: "1" },
    { url: "/icons/icon-96x96.png", revision: "1" },
    { url: "/icons/icon-128x128.png", revision: "1" },
    { url: "/icons/icon-144x144.png", revision: "1" },
    { url: "/icons/icon-152x152.png", revision: "1" },
    { url: "/icons/icon-192x192.png", revision: "1" },
    { url: "/icons/icon-384x384.png", revision: "1" },
    { url: "/icons/icon-512x512.png", revision: "1" },
  ];

  precacheAndRoute(precacheManifest);

  // Update CSS caching strategy to be more aggressive
  registerRoute(
    ({ request }) => request.destination === "style",
    new strategies.CacheFirst({
      cacheName: "styles",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          maxEntries: 30, // Limit number of entries
        }),
      ]
    })
  );

  // Cache JavaScript
  registerRoute(
    ({ request }) => request.destination === "script",
    new strategies.StaleWhileRevalidate({
      cacheName: "static-resources",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );

  // Cache images
  registerRoute(
    ({ request }) => request.destination === "image",
    new strategies.CacheFirst({
      cacheName: "images",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );

  // Cache API requests
  registerRoute(
    ({ url }) =>
      url.pathname.startsWith("/api") || url.href.includes("dicoding.dev"),
    new strategies.NetworkFirst({
      cacheName: "api-responses",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        }),
      ],
      networkTimeoutSeconds: 3,
    })
  );

  // Default handler for all other requests
  registerRoute(
    () => true,
    new strategies.NetworkFirst({
      cacheName: "default",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
      networkTimeoutSeconds: 3,
    })
  );
} else {
  console.log("Workbox failed to load");
}

// Push notifications
self.addEventListener("push", (event) => {
  let body;

  if (event.data) {
    try {
      const data = event.data.json();
      body = data.body || data.message || event.data.text();
    } catch (e) {
      body = event.data.text();
    }
  } else {
    body = "New notification from Story App";
  }

  const options = {
    body: body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "open",
        title: "Open App",
        icon: "/icons/icon-72x72.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("Story App", options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll().then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      // If not open, open new window
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

// Handle network status changes
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Online/Offline status handling
self.addEventListener("online", () => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "ONLINE_STATUS",
        isOnline: true,
      });
    });
  });
});

self.addEventListener("offline", () => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "ONLINE_STATUS",
        isOnline: false,
      });
    });
  });
});
