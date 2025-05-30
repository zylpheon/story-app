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
  const { BackgroundSyncPlugin } = workbox.backgroundSync;

  // Precache core app shell dengan relative paths
  const precacheManifest = [
    { url: "./", revision: "1" },
    { url: "./index.html", revision: "1" },
    { url: "./favicon.png", revision: "1" },
    { url: "./manifest.json", revision: "1" },
    // CSS files dengan relative paths
    { url: "./styles/styles.css", revision: "1" },
    { url: "./styles/story.css", revision: "1" },
    { url: "./styles/home.css", revision: "1" },
    { url: "./styles/auth.css", revision: "1" },
    { url: "./styles/transitions.css", revision: "1" },
    // Icons dengan relative paths
    { url: "./icons/icon-72x72.png", revision: "1" },
    { url: "./icons/icon-96x96.png", revision: "1" },
    { url: "./icons/icon-128x128.png", revision: "1" },
    { url: "./icons/icon-144x144.png", revision: "1" },
    { url: "./icons/icon-152x152.png", revision: "1" },
    { url: "./icons/icon-192x192.png", revision: "1" },
    { url: "./icons/icon-384x384.png", revision: "1" },
    { url: "./icons/icon-512x512.png", revision: "1" },
  ];

  // Tambahkan base URL untuk production
  if (self.location.hostname !== "localhost") {
    const BASE_URL = "https://story-app-valentino-dicoding.netlify.app";
    precacheManifest.forEach((entry) => {
      entry.url = BASE_URL + entry.url.substring(1); // Remove the dot and add base URL
    });
  }

  precacheAndRoute(precacheManifest);

  // Cache CSS
  registerRoute(
    ({ request }) => request.destination === "style",
    new strategies.StaleWhileRevalidate({
      cacheName: "styles",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          maxEntries: 30,
        }),
      ],
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

  // Background sync plugin untuk offline requests
  const bgSyncPlugin = new BackgroundSyncPlugin("offline-requests", {
    maxRetentionTime: 24 * 60, // Retry for max of 24 Hours (specified in minutes)
  });

  // Cache API requests dengan background sync untuk POST
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
    }),
    "GET"
  );

  // Register route for offline POST requests with background sync
  registerRoute(
    ({ url, request }) =>
      (url.pathname.startsWith("/api/") || url.href.includes("dicoding.dev")) &&
      request.method === "POST",
    new strategies.NetworkOnly({
      plugins: [bgSyncPlugin],
    })
  );

  // Default network-first strategy untuk semua request lainnya
  registerRoute(
    ({ request }) => request.mode === "navigate",
    new strategies.NetworkFirst({
      cacheName: "pages",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
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

// Handle service worker messages
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Handle background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "offline-requests") {
    console.log("Background sync triggered for offline requests");
  }

  if (event.tag === "sync-stories") {
    event.waitUntil(syncStories());
  }
});

// Function untuk sync stories
async function syncStories() {
  try {
    const cache = await caches.open("api-responses");
    const requests = await cache.keys();

    const syncPromises = requests
      .filter((request) => request.url.includes("dicoding.dev"))
      .map(async (request) => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
            return networkResponse;
          }
        } catch (error) {
          console.error("Sync failed for:", request.url, error);
          return null;
        }
      });

    await Promise.all(syncPromises);
    console.log("Stories synced successfully");
  } catch (error) {
    console.error("Story sync failed:", error);
  }
}

// Handle install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing");
  self.skipWaiting();
});

// Handle activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches if needed
            if (
              cacheName.startsWith("workbox-") &&
              cacheName !== "workbox-precache-v2"
            ) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});
