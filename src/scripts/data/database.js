// Database configuration
const DB_NAME = 'story-app-db';
const DB_VERSION = 1;
const OBJECT_STORE_NAME = 'stories';
const FAVORITE_STORE_NAME = 'favorite-stories';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FAVORITE_STORE_NAME)) {
        db.createObjectStore(FAVORITE_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const DatabaseHelper = {
  async saveStories(stories) {
    try {
      const db = await openDB();
      const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(OBJECT_STORE_NAME);
      
      // Save each story
      await Promise.all(stories.map(story => {
        // Save story images as blobs
        return fetch(story.photoUrl)
          .then(response => response.blob())
          .then(blob => {
            // Store the image blob along with story data
            const storyWithImage = {
              ...story,
              photoBlob: blob,
              timestamp: new Date().getTime()
            };
            return store.put(storyWithImage);
          });
      }));

      return true;
    } catch (error) {
      console.error('Error saving stories:', error);
      return false;
    }
  },
  
  // Get all stories from IndexedDB
  async getAllStories() {
    try {
      const db = await openDB();
      const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(OBJECT_STORE_NAME);
      
      let stories = await store.getAll();
      
      // Convert stored blobs back to URLs
      stories = await Promise.all(stories.map(async (story) => {
        if (story.photoBlob) {
          story.photoUrl = URL.createObjectURL(story.photoBlob);
        }
        return story;
      }));
      
      // Sort by timestamp
      return stories.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting stories:', error);
      return [];
    }
  },
  
  // Get a story by ID from IndexedDB
  async getStory(id) {
    try {
      const db = await openDB();
      const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(OBJECT_STORE_NAME);
      
      const story = await store.get(id);
      if (story && story.photoBlob) {
        story.photoUrl = URL.createObjectURL(story.photoBlob);
      }
      
      return story;
    } catch (error) {
      console.error('Error getting story:', error);
      return null;
    }
  },
  
  // Save a story to favorites
  async addToFavorites(story) {
    const db = await openDB();
    const transaction = db.transaction(FAVORITE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(FAVORITE_STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put(story);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error('Failed to add to favorites'));
    });
  },
  
  // Get all favorite stories
  async getFavoriteStories() {
    const db = await openDB();
    const transaction = db.transaction(FAVORITE_STORE_NAME, 'readonly');
    const store = transaction.objectStore(FAVORITE_STORE_NAME);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get favorite stories'));
    });
  },
  
  // Remove a story from favorites
  async removeFromFavorites(id) {
    const db = await openDB();
    const transaction = db.transaction(FAVORITE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(FAVORITE_STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error('Failed to remove from favorites'));
    });
  },
  
  // Check if a story is in favorites
  async isFavorite(id) {
    const db = await openDB();
    const transaction = db.transaction(FAVORITE_STORE_NAME, 'readonly');
    const store = transaction.objectStore(FAVORITE_STORE_NAME);
    const request = store.get(id);
    
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => resolve(false);
    });
  }
};

// Clean up object URLs when page unloads
window.addEventListener('unload', () => {
  const objectUrls = [];
  objectUrls.forEach(url => URL.revokeObjectURL(url));
});

export default DatabaseHelper;