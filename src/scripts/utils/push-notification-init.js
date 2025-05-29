import NotificationHelper from './notification-helper';

const PushNotificationInit = {
  async init() {
    const hasPermission = await NotificationHelper.requestPermission();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return;
    }

    const serviceWorkerRegistration = await NotificationHelper.registerServiceWorker();
    if (!serviceWorkerRegistration) {
      console.log('Service worker registration failed');
      return;
    }

    const pushSubscription = await NotificationHelper.subscribeToPushNotification(serviceWorkerRegistration);
    if (!pushSubscription) {
      console.log('Failed to subscribe to push notification');
      return;
    }

    // You can send this subscription object to your server
    // to enable sending push notifications to this user
    console.log('Push Notification subscription:', JSON.stringify(pushSubscription));
    
    // Example of how to use this subscription data
    // await this.sendSubscriptionToServer(pushSubscription);
  },

  // This function would be used to send the subscription to your backend
  async sendSubscriptionToServer(subscription) {
    // Implement this method to send the subscription to your server
    // Example:
    // const response = await fetch('YOUR_API_ENDPOINT/subscribe', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(subscription),
    // });
    // return response.json();
  },
};

export default PushNotificationInit;