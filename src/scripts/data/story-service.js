import CONFIG from "../config";
import AuthService from "./auth-service";
import DatabaseHelper from "./database";

const StoryService = {
  async getAllStories(page = 1, size = 10, location = 0) {
    try {
      const token = AuthService.getToken();
      const response = await fetch(
        `${CONFIG.BASE_URL}/stories?page=${page}&size=${size}&location=${location}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      // Save stories to IndexedDB for offline access
      await DatabaseHelper.saveStories(responseJson.listStory);
      return responseJson.listStory;

    } catch (error) {
      console.log('Failed to fetch from network, trying IndexedDB...');
      const offlineStories = await DatabaseHelper.getAllStories();
      
      if (offlineStories && offlineStories.length > 0) {
        console.log('Returning stories from IndexedDB');
        // Return paginated results when offline
        const start = (page - 1) * size;
        const end = start + size;
        return offlineStories.slice(start, end);
      }
      
      throw error;
    }
  },

  async getStoryDetail(id) {
    try {
      const token = AuthService.getToken();
      const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      // Save individual story to IndexedDB
      await DatabaseHelper.saveStories([responseJson.story]);
      return responseJson.story;

    } catch (error) {
      console.log('Failed to fetch story detail from network, trying IndexedDB...');
      const offlineStory = await DatabaseHelper.getStory(id);
      
      if (offlineStory) {
        console.log('Returning story from IndexedDB');
        return offlineStory;
      }
      
      throw error;
    }
  },

  async addStory(formData) {
    const token = AuthService.getToken();

    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  },

  async addStoryAsGuest(formData) {
    const response = await fetch(`${CONFIG.BASE_URL}/stories/guest`, {
      method: "POST",
      body: formData,
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  },
  
  // Favorite story functions
  async addToFavorites(story) {
    return DatabaseHelper.addToFavorites(story);
  },
  
  async removeFromFavorites(id) {
    return DatabaseHelper.removeFromFavorites(id);
  },
  
  async getFavoriteStories() {
    return DatabaseHelper.getFavoriteStories();
  },
  
  async isFavorite(id) {
    return DatabaseHelper.isFavorite(id);
  },

  // Fungsi untuk mendaftarkan push notification
  async registerPushNotification() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push notification is not supported in this browser");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered successfully", registration);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: CONFIG.VAPID_PUBLIC_KEY,
      });

      console.log("Push notification registered successfully", subscription);
      return subscription;
    } catch (error) {
      console.error("Failed to register push notification", error);
    }
  },
};

export default StoryService;
