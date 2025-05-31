importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);
importScripts("https://cdn.jsdelivr.net/npm/idb@7/build/umd.js");

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

  // Precache core app shell
  const precacheManifest = [
    { url: "/", revision: "1" },
    { url: "/index.html", revision: "1" },
    { url: "/favicon.png", revision: "1" },
    { url: "/manifest.json", revision: "1" },
    // CSS files
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

  // Cache CSS
  registerRoute(
    ({ request }) => request.destination === "style",
    new strategies.StaleWhileRevalidate({
      cacheName: "styles-cache",
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
      cacheName: "js-cache",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          maxEntries: 50,
        }),
      ],
    })
  );

  // Cache images
  registerRoute(
    ({ request }) => request.destination === "image",
    new strategies.CacheFirst({
      cacheName: "images-cache",
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

  // Cache API requests - GET requests
  registerRoute(
    ({ url, request }) =>
      (url.pathname.startsWith("/api/") || url.href.includes("dicoding.dev")) &&
      request.method === "GET",
    new strategies.NetworkFirst({
      cacheName: "api-cache",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 12 * 60 * 60, // 12 hours instead of 24
        }),
      ],
      networkTimeoutSeconds: 10, // Increased timeout
      matchOptions: {
        ignoreSearch: false, // Consider query parameters
      },
    })
  );

  // Handle POST requests dengan background sync
  registerRoute(
    ({ url, request }) =>
      (url.pathname.startsWith("/api/") || url.href.includes("dicoding.dev")) &&
      request.method === "POST",
    new strategies.NetworkOnly({
      plugins: [bgSyncPlugin],
    })
  );

  // Cache navigasi pages
  registerRoute(
    ({ request }) => request.mode === "navigate",
    new strategies.NetworkFirst({
      cacheName: "pages-cache",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxAgeSeconds: 7 * 24 * 60 * 60, // Fixed 'sixty' to 60
          maxEntries: 50,
        }),
      ],
      networkTimeoutSeconds: 10, // Increased timeout
    })
  );

  // Fallback untuk offline
  workbox.routing.setCatchHandler(({ event }) => {
    switch (event.request.destination) {
      case "document":
        return caches.match("/");
      case "image":
        return caches.match("/icons/icon-192x192.png");
      default:
        return Response.error();
    }
  });
} else {
  console.log("Workbox failed to load");
}

// IndexedDB helper functions
async function openDB(name, version, options = {}) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (options.upgrade) {
        options.upgrade(db, event.oldVersion, event.newVersion);
      }
    };
  });
}

// Push notifications
self.addEventListener("push", (event) => {
  let body = "New notification from Story App";
  let title = "Story App";
  let data = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      body =
        payload.body || payload.message || payload.notification?.body || body;
      title = payload.title || payload.notification?.title || title;
      data = payload.data || {};
    } catch (e) {
      body = event.data.text() || body;
    }
  }

  const options = {
    body: body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: Date.now(),
      ...data,
    },
    actions: [
      {
        action: "open",
        title: "Open App",
        icon: "/icons/icon-72x72.png",
      },
      {
        action: "close",
        title: "Close",
      },
    ],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
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
    return;
  }

  // Handle remove favourite
  if (event.data && event.data.type === "REMOVE_FAVOURITE") {
    event.waitUntil(removeFavouriteStory(event.data.storyId));
    return;
  }

  // Handle add favourite
  if (event.data && event.data.type === "ADD_FAVOURITE") {
    event.waitUntil(addFavouriteStory(event.data.story));
    return;
  }

  // Handle get favourites
  if (event.data && event.data.type === "GET_FAVOURITES") {
    event.waitUntil(
      getFavouriteStories().then((stories) => {
        event.ports[0].postMessage({ stories });
      })
    );
    return;
  }
});

// Favourite stories management functions
async function addFavouriteStory(story) {
  try {
    const db = await openDB("story-app-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("favourite-stories")) {
          db.createObjectStore("favourite-stories", { keyPath: "id" });
        }
      },
    });

    const tx = db.transaction("favourite-stories", "readwrite");
    const store = tx.objectStore("favourite-stories");
    await store.put(story);
    console.log("Story added to favourites:", story.id);
  } catch (error) {
    console.error("Error adding story to favourites:", error);
  }
}

async function removeFavouriteStory(storyId) {
  try {
    const db = await openDB("story-app-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("favourite-stories")) {
          db.createObjectStore("favourite-stories", { keyPath: "id" });
        }
      },
    });

    const tx = db.transaction("favourite-stories", "readwrite");
    const store = tx.objectStore("favourite-stories");
    await store.delete(storyId);
    console.log("Story removed from favourites:", storyId);
  } catch (error) {
    console.error("Error removing story from favourites:", error);
  }
}

async function getFavouriteStories() {
  try {
    const db = await openDB("story-app-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("favourite-stories")) {
          db.createObjectStore("favourite-stories", { keyPath: "id" });
        }
      },
    });

    const tx = db.transaction("favourite-stories", "readonly");
    const store = tx.objectStore("favourite-stories");
    return await store.getAll();
  } catch (error) {
    console.error("Error getting favourite stories:", error);
    return [];
  }
}

// Handle background sync
self.addEventListener("sync", (event) => {
  console.log("Background sync event:", event.tag);

  if (event.tag === "offline-requests") {
    console.log("Background sync triggered for offline requests");
    // Workbox akan menangani ini secara otomatis
  }

  if (event.tag === "sync-stories") {
    event.waitUntil(syncStories());
  }

  if (event.tag === "sync-favourites") {
    event.waitUntil(syncFavouriteStories());
  }
});

// Function untuk sync stories
async function syncStories() {
  try {
    console.log("Syncing stories...");
    const cache = await caches.open("api-cache");
    const requests = await cache.keys();

    const syncPromises = requests
      .filter(
        (request) =>
          request.url.includes("dicoding.dev") && request.method === "GET"
      )
      .map(async (request) => {
        try {
          // Force network request
          const networkResponse = await fetch(request.clone(), {
            cache: "reload",
            headers: {
              "Cache-Control": "no-cache",
            },
          });

          if (networkResponse.ok) {
            await cache.delete(request); // Delete old cache first
            await cache.put(request, networkResponse.clone());
            console.log("Synced:", request.url);
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

// Function untuk sync favourite stories
async function syncFavouriteStories() {
  try {
    console.log("Syncing favourite stories...");
    const favourites = await getFavouriteStories();

    // Sync each favourite story
    const syncPromises = favourites.map(async (story) => {
      try {
        const response = await fetch(
          `https://story-api.dicoding.dev/v1/stories/${story.id}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.story) {
            await addFavouriteStory(data.story);
          }
        }
      } catch (error) {
        console.error("Error syncing favourite story:", story.id, error);
      }
    });

    await Promise.all(syncPromises);
    console.log("Favourite stories synced successfully");
  } catch (error) {
    console.error("Favourite stories sync failed:", error);
  }
}

// Handle install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing");
  // Skip waiting untuk langsung mengaktifkan SW baru
  self.skipWaiting();
});

// Handle activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");

  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // More aggressive cache cleanup
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            const keepCaches = [
              "workbox-precache-v2",
              "styles-cache",
              "js-cache",
              "images-cache",
              "api-cache",
              "pages-cache",
            ];

            if (!keepCaches.includes(cacheName)) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
            return null;
          })
        );
      }),
      // Clear old API cache
      caches.open("api-cache").then((cache) => {
        return cache.keys().then((keys) => {
          return Promise.all(
            keys.map((key) => {
              // Delete cached API responses older than 12 hours
              return cache.match(key).then((response) => {
                if (response) {
                  const date = new Date(response.headers.get("date"));
                  if (Date.now() - date.getTime() > 12 * 60 * 60 * 1000) {
                    return cache.delete(key);
                  }
                }
                return Promise.resolve();
              });
            })
          );
        });
      }),
    ])
  );
});

// Handle fetch events (sebagai fallback)
self.addEventListener("fetch", (event) => {
  // Workbox akan menangani sebagian besar fetch events
  // Ini hanya sebagai fallback untuk kasus khusus
  if (event.request.method !== "GET") {
    return;
  }

  // Skip untuk requests yang sudah ditangani Workbox
  if (
    event.request.url.includes("workbox") ||
    event.request.url.includes("chrome-extension")
  ) {
    return;
  }
});
