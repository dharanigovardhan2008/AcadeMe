import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";

// ══════════════════════════════════════════════════════════════
// 🔥 FIREBASE CONFIG
// ══════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// ══════════════════════════════════════════════════════════════
// 🔔 FCM MESSAGING (Lazy Init - Safe for all browsers)
// ══════════════════════════════════════════════════════════════

let messagingInstance = null;

const getMessagingInstance = async () => {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) return null;
  messagingInstance = getMessaging(app);
  return messagingInstance;
};

// ══════════════════════════════════════════════════════════════
// 🔑 REQUEST PERMISSION & SAVE TOKEN
// ══════════════════════════════════════════════════════════════

export const requestNotificationPermission = async (userId) => {
  try {
    // Check if browser supports FCM
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.log("❌ FCM not supported in this browser");
      return null;
    }

    // Ask for permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("❌ Notification permission denied");
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // Get FCM token - Try both VAPID key variable names
    const vapidKey =
      import.meta.env.VITE_FIREBASE_VAPID_KEY ||
      import.meta.env.VITE_VAPID_KEY;

    if (!vapidKey) {
      console.error("❌ VAPID key is missing! Add VITE_FIREBASE_VAPID_KEY to .env");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("❌ Failed to generate FCM token");
      return null;
    }

    console.log("✅ FCM Token generated:", token.substring(0, 20) + "...");

    // Save token to BOTH locations (notify.py reads both)
    if (userId) {
      // Location 1: fcm_tokens collection
      await setDoc(
        doc(db, "fcm_tokens", userId),
        {
          token: token,
          userId: userId,
          updatedAt: serverTimestamp(),
          platform: navigator.platform || "unknown",
          userAgent: navigator.userAgent || "unknown",
        },
        { merge: true }
      );

      // Location 2: users collection
      await setDoc(
        doc(db, "users", userId),
        {
          fcmToken: token,
          notificationsEnabled: true,
        },
        { merge: true }
      );

      console.log("✅ FCM token saved to Firestore (both locations)");
    }

    return token;
  } catch (error) {
    console.error("❌ Notification setup error:", error);
    return null;
  }
};

// ══════════════════════════════════════════════════════════════
// 📩 FOREGROUND MESSAGE HANDLER
// ══════════════════════════════════════════════════════════════

export const onForegroundMessage = async (callback) => {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("📩 Foreground notification:", payload);

    // Show browser notification even when app is open
    const notification = payload.notification;
    if (notification && Notification.permission === "granted") {
      const title = notification.title || "AcadeMe";
      const options = {
        body: notification.body || "New update available",
        icon: "/icon-192.png",
        badge: "/badge-96.png",
        tag: "acade-me-fg-" + Date.now(),
      };

      new Notification(title, options);
    }

    // Also call custom callback if provided
    if (callback) callback(payload);
  });
};

export default app;
