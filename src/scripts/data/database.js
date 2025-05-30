// Database configuration
const DB_NAME = "story-app-db";
const DB_VERSION = 1;
const OBJECT_STORE_NAME = "stories";
const FAVORITE_STORE_NAME = "favorite-stories";

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        db.createObjectStore(OBJECT_STORE_NAME, { keyPath: "id" });
        console.log('Object store "stories" created');
      }
      if (!db.objectStoreNames.contains(FAVORITE_STORE_NAME)) {
        db.createObjectStore(FAVORITE_STORE_NAME, { keyPath: "id" });
        console.log('Object store "favorite-stories" created');
      }
    };
  });
};

const DatabaseHelper = {
  async saveStories(stories) {
    try {
      const db = await openDB();

      // Fetch all images first, outside of any transaction
      const storiesWithImages = await Promise.all(
        stories.map(async (story) => {
          try {
            const response = await fetch(story.photoUrl);
            const blob = await response.blob();

            return {
              ...story,
              photoBlob: blob,
              timestamp: new Date().getTime(),
            };
          } catch (error) {
            console.error(
              `Failed to fetch image for story ${story.id}:`,
              error.message
            );
            // Return story without blob if image fetch fails
            return {
              ...story,
              timestamp: new Date().getTime(),
            };
          }
        })
      );

      // Now save all stories in a single transaction
      const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
      const store = transaction.objectStore(OBJECT_STORE_NAME);

      // Add all stories to the transaction
      const promises = storiesWithImages.map((story) => {
        return new Promise((resolve, reject) => {
          const request = store.put(story);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });

      // Wait for transaction to complete
      await Promise.all([
        ...promises,
        new Promise((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(new Error("Transaction aborted"));
        }),
      ]);

      return true;
    } catch (error) {
      console.error("Error in saveStories:", error.message);
      return false;
    }
  },

  // Get all stories from IndexedDB
  async getAllStories() {
    try {
      const db = await openDB();
      const transaction = db.transaction(OBJECT_STORE_NAME, "readonly");
      const store = transaction.objectStore(OBJECT_STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = async () => {
          let stories = request.result;

          // Convert stored blobs back to URLs
          stories = await Promise.all(
            stories.map(async (story) => {
              if (story.photoBlob) {
                story.photoUrl = URL.createObjectURL(story.photoBlob);
              }
              return story;
            })
          );

          // Sort by timestamp
          resolve(stories.sort((a, b) => b.timestamp - a.timestamp));
        };

        request.onerror = () => {
          console.error("Error getting stories:", request.error);
          resolve([]);
        };
      });
    } catch (error) {
      console.error("Error getting stories:", error);
      return [];
    }
  },

  // Get a story by ID from IndexedDB
  async getStory(id) {
    try {
      const db = await openDB();
      const transaction = db.transaction(OBJECT_STORE_NAME, "readonly");
      const store = transaction.objectStore(OBJECT_STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.get(id);

        request.onsuccess = () => {
          const story = request.result;
          if (story && story.photoBlob) {
            story.photoUrl = URL.createObjectURL(story.photoBlob);
          }
          resolve(story);
        };

        request.onerror = () => {
          console.error("Error getting story:", request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.error("Error getting story:", error);
      return null;
    }
  },

  // Save a story to favorites
  async addToFavorites(story) {
    try {
      const db = await openDB();
      const transaction = db.transaction(FAVORITE_STORE_NAME, "readwrite");
      const store = transaction.objectStore(FAVORITE_STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.put(story);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(new Error("Failed to add to favorites"));
      });
    } catch (error) {
      console.error("Error adding to favorites:", error);
      return false;
    }
  },

  // Get all favorite stories
  async getFavoriteStories() {
    try {
      const db = await openDB();
      const transaction = db.transaction(FAVORITE_STORE_NAME, "readonly");
      const store = transaction.objectStore(FAVORITE_STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = async () => {
          let stories = request.result;

          // Convert stored blobs back to URLs if needed
          stories = await Promise.all(
            stories.map(async (story) => {
              if (story.photoBlob) {
                story.photoUrl = URL.createObjectURL(story.photoBlob);
              }
              return story;
            })
          );

          resolve(stories);
        };
        request.onerror = () => {
          console.error("Failed to get favorite stories:", request.error);
          resolve([]);
        };
      });
    } catch (error) {
      console.error("Error getting favorite stories:", error);
      return [];
    }
  },

  // Remove a story from favorites
  async removeFromFavorites(id) {
    try {
      const db = await openDB();
      const transaction = db.transaction(FAVORITE_STORE_NAME, "readwrite");
      const store = transaction.objectStore(FAVORITE_STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () =>
          reject(new Error("Failed to remove from favorites"));
      });
    } catch (error) {
      console.error("Error removing from favorites:", error);
      return false;
    }
  },

  // Check if a story is in favorites
  async isFavorite(id) {
    try {
      const db = await openDB();
      const transaction = db.transaction(FAVORITE_STORE_NAME, "readonly");
      const store = transaction.objectStore(FAVORITE_STORE_NAME);

      return new Promise((resolve) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      return false;
    }
  },
};

// Clean up object URLs when page unloads
window.addEventListener("unload", () => {
  const objectUrls = [];
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
});

export default DatabaseHelper;
