// src/firebase-messaging.js
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (avoid duplicate init)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

/**
 * Request notification permission, register SW, get FCM token, and save to Firestore.
 * @param {string} userId - The authenticated user's UID
 * @returns {Promise<string|null>} FCM token or null
 */
export async function requestNotificationPermission(userId) {
  try {
    // Check if browser supports messaging
    const supported = await isSupported();
    if (!supported) {
      console.warn("Firebase Messaging is not supported in this browser.");
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied.");
      return null;
    }

    // Register service worker manually to ensure it loads from root
    let swRegistration;
    try {
      swRegistration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" }
      );
      await navigator.serviceWorker.ready;
    } catch (swErr) {
      console.error("Service worker registration failed:", swErr);
      return null;
    }

    const messaging = getMessaging(app);

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      console.warn("No FCM token received.");
      return null;
    }

    console.log("FCM Token:", token);

    // Save token to Firestore under fcm_tokens/{userId}
    if (userId) {
      await setDoc(
        doc(db, "fcm_tokens", userId),
        {
          token,
          userId,
          updatedAt: serverTimestamp(),
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
        { merge: true }
      );
      console.log("FCM token saved to Firestore for user:", userId);
    }

    return token;
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return null;
  }
}

/**
 * Listen for foreground messages (app is open).
 * @param {function} callback - Called with the payload when a message arrives
 */
export async function onForegroundMessage(callback) {
  const supported = await isSupported();
  if (!supported) return;

  const messaging = getMessaging(app);
  return onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    callback(payload);
  });
}

/**
 * Delete the FCM token for a user (called on sign-out or when disabling notifications).
 * @param {string} userId
 */
export async function deleteFCMToken(userId) {
  try {
    const supported = await isSupported();
    if (!supported) return;

    const messaging = getMessaging(app);
    const { deleteToken } = await import("firebase/messaging");
    await deleteToken(messaging);

    if (userId) {
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "fcm_tokens", userId));
      console.log("FCM token deleted for user:", userId);
    }
  } catch (err) {
    console.error("Error deleting FCM token:", err);
  }
}

export { app, db };
