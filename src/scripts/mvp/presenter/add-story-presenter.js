import AuthService from "../../data/auth-service";
import CONFIG from "../../config";

export default class AddStoryPresenter {
  #view = null;
  #model = null;
  #map = null;
  #marker = null;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
    this.#view.setPresenter(this);
  }

  async init() {
    this.registerPushNotification();
  }

  async submitStory(storyData) {
    try {
      const formData = new FormData();
      formData.append("description", storyData.description);
      formData.append("photo", storyData.photoFile);

      if (storyData.lat && storyData.lon) {
        formData.append("lat", storyData.lat);
        formData.append("lon", storyData.lon);
      }

      let response;
      if (this.isLoggedIn()) {
        response = await this.#model.addStory(formData);
      } else {
        response = await this.#model.addStoryAsGuest(formData);
      }

      this.showNotification(storyData.description);
      this.#view.showSuccess("Story added successfully!");
    } catch (error) {
      this.#view.showError(`Failed to add story: ${error.message}`);
    } finally {
      this.#view.hideSubmitLoading();
    }
  }

  isLoggedIn() {
    return AuthService.isLoggedIn();
  }

  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  async initializeMap(mapElement, onLocationSelect) {
    if (!document.getElementById("leaflet-css")) {
      const leafletCSS = document.createElement("link");
      leafletCSS.id = "leaflet-css";
      leafletCSS.rel = "stylesheet";
      leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(leafletCSS);
    }

    if (!window.L) {
      await new Promise((resolve) => {
        const leafletScript = document.createElement("script");
        leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        leafletScript.onload = resolve;
        document.head.appendChild(leafletScript);
      });
    }

    try {
      // Get current location as default
      const position = await this.getCurrentLocation();
      const { latitude, longitude } = position;

      // Initialize map
      if (!this.#map) {
        this.#map = L.map(mapElement).setView([latitude, longitude], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Add marker for current location
        this.#marker = L.marker([latitude, longitude]).addTo(this.#map);

        // Handle map click to update location
        this.#map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          
          // Update marker position
          this.#marker.setLatLng([lat, lng]);
          
          // Call callback with new coordinates
          onLocationSelect(lat, lng);
        });
      } else {
        // Just update the view if map already exists
        this.#map.setView([latitude, longitude], 13);
        this.#marker.setLatLng([latitude, longitude]);
      }

      // Ensure map is properly sized
      setTimeout(() => {
        this.#map.invalidateSize();
      }, 100);

      return this.#map;
    } catch (error) {
      this.#view.showError(`Error initializing map: ${error.message}`);
    }
  }

  async registerPushNotification() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("Push notification is not supported in this browser");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered successfully", registration);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.getVapidPublicKey(),
      });

      console.log("Push notification registered successfully", subscription);
      return subscription;
    } catch (error) {
      console.error("Failed to register push notification", error);
    }
  }

  getVapidPublicKey() {
    return CONFIG.VAPID_PUBLIC_KEY;
  }

  showNotification(description) {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    if (Notification.permission === "granted") {
      new Notification("Story berhasil dibuat", {
        body: `Anda telah membuat story baru dengan deskripsi: ${description.substring(0, 50)}${description.length > 50 ? "..." : ""}`,
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Story berhasil dibuat", {
            body: `Anda telah membuat story baru dengan deskripsi: ${description.substring(0, 50)}${description.length > 50 ? "..." : ""}`,
          });
        }
      });
    }
  }
}