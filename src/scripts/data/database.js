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
      
      // Create object store for stories
      if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
      }
      
      // Create object store for favorite stories
      if (!db.objectStoreNames.contains(FAVORITE_STORE_NAME)) {
        db.createObjectStore(FAVORITE_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const DatabaseHelper = {
  // Save stories to IndexedDB
  async saveStories(stories) {
    const db = await openDB();
    const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(OBJECT_STORE_NAME);
    
    stories.forEach((story) => {
      store.put(story);
    });
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(new Error('Failed to save stories'));
    });
  },
  
  // Get all stories from IndexedDB
  async getAllStories() {
    const db = await openDB();
    const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
    const store = transaction.objectStore(OBJECT_STORE_NAME);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get stories'));
    });
  },
  
  // Get a story by ID from IndexedDB
  async getStory(id) {
    const db = await openDB();
    const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
    const store = transaction.objectStore(OBJECT_STORE_NAME);
    const request = store.get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get story'));
    });
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

export default DatabaseHelper;