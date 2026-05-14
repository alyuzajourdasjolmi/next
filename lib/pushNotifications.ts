/**
 * Push Notification Client Utilities
 * Shared helper functions for subscribing to push notifications
 * Used by both the user-facing page and admin dashboard.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Convert a base64 VAPID key to a Uint8Array for the Push API
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register the service worker and subscribe to push notifications.
 * @param userId - Supabase user ID
 * @param role - 'admin' or 'user'
 * @returns true if successfully subscribed
 */
export async function subscribeToPush(userId: string, role: 'admin' | 'user' = 'user'): Promise<boolean> {
  try {
    // Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser.');
      return false;
    }

    // Check VAPID key availability
    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID public key is not configured.');
      return false;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied.');
      return false;
    }

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Subscribe to push
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });
    }

    // Save subscription to backend
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        user_id: userId,
        role,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to save subscription:', errorData);
      return false;
    }

    console.log(`Push notification subscription successful for ${role}:`, userId);
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
}

/**
 * Send a push notification via the API
 * @param options - Target and message details
 */
export async function sendPushNotification(options: {
  target_user_id?: string;
  target_role?: string;
  title: string;
  message: string;
  url?: string;
  tag?: string;
}): Promise<boolean> {
  try {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send push notification:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('Push notification sent:', result);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}
