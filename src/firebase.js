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

let messagingInstance = null;

const getMessagingInstance = async () => {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) return null;
  messagingInstance = getMessaging(app);
  return messagingInstance;
};

export const requestNotificationPermission = async (userId) => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.log("❌ FCM not supported in this browser");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("❌ Notification permission denied");
      return null;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const vapidKey =
      import.meta.env.VITE_FIREBASE_VAPID_KEY ||
      import.meta.env.VITE_VAPID_KEY;

    if (!vapidKey) {
      console.error("❌ VAPID key missing! Add VITE_FIREBASE_VAPID_KEY to .env");
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

    if (userId) {
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

      await setDoc(
        doc(db, "users", userId),
        {
          fcmToken: token,
          notificationsEnabled: true,
        },
        { merge: true }
      );

      console.log("✅ FCM token saved to Firestore");
    }

    return token;
  } catch (error) {
    console.error("❌ Notification setup error:", error);
    return null;
  }
};

export const onForegroundMessage = async (callback) => {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("📩 Foreground notification:", payload);

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

    if (callback) callback(payload);
  });
};

export default app;
