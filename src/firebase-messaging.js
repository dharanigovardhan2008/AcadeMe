// src/firebase-messaging.js

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

/* Firebase configuration */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/* Initialize Firebase */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

/* Request notification permission and generate FCM token */
export async function requestNotificationPermission(userId) {
  try {

    const supported = await isSupported();
    if (!supported) {
      console.warn("Firebase messaging not supported in this browser");
      return null;
    }

    /* Ask notification permission */
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return null;
    }

    /* Register service worker */
    const swRegistration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const messaging = getMessaging(app);

    /* Generate token */
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      console.warn("Failed to generate FCM token");
      return null;
    }

    console.log("FCM Token:", token);

    /* Save token in Firestore */
    if (userId) {
      await setDoc(
        doc(db, "fcm_tokens", userId),
        {
          token: token,
          userId: userId,
          updatedAt: serverTimestamp(),
          platform: navigator.platform,
          userAgent: navigator.userAgent,
        },
        { merge: true }
      );

      console.log("FCM token saved in Firestore");
    }

    return token;

  } catch (error) {
    console.error("Notification setup error:", error);
    return null;
  }
}

/* Handle foreground notifications (when site is open) */
export async function onForegroundMessage(callback) {

  const supported = await isSupported();
  if (!supported) return;

  const messaging = getMessaging(app);

  onMessage(messaging, (payload) => {

    console.log("Foreground notification:", payload);

    const notification = payload.notification;

    if (notification) {

      const title = notification.title || "AcadeMe";
      const options = {
        body: notification.body || "New update available",
        icon: notification.icon || "/icon-192.png"
      };

      new Notification(title, options);
    }

    if (callback) callback(payload);
  });
}

export { app, db };
