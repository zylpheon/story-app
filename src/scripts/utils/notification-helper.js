import CONFIG from '../config';

const NotificationHelper = {
  async requestPermission() {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.error('Notification permission denied');
      return false;
    }
    
    console.log('Notification permission granted');
    return true;
  },

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker not supported in the browser');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  },

  async subscribeToPushNotification(registration) {
    try {
      const subscribed = await registration.pushManager.getSubscription();
      if (subscribed) {
        return subscribed;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
      });

      console.log('Push notification subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  },

  // Convert base64 string to Uint8Array for applicationServerKey
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },
};

export default NotificationHelper;