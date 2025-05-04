import CONFIG from "../config";
import AuthService from "./auth-service";

const StoryService = {
  async getAllStories(page = 1, size = 10, location = 0) {
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

    return responseJson.listStory;
  },

  async getStoryDetail(id) {
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

    return responseJson.story;
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
