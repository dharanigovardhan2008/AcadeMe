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
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

/* Request Notification Permission + Get Token */
export async function requestNotificationPermission(userId) {
  try {

    const supported = await isSupported();
    if (!supported) {
      console.warn("Messaging not supported in this browser");
      return null;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return null;
    }

    /* Register service worker */
    const swRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    await navigator.serviceWorker.ready;

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });

    if (!token) {
      console.warn("FCM token not generated");
      return null;
    }

    console.log("FCM Token:", token);

    /* Save token in Firestore */
    if (userId) {
      await setDoc(
        doc(db, "fcm_tokens", userId),
        {
          token: token,
          updatedAt: serverTimestamp(),
          platform: navigator.platform,
          userAgent: navigator.userAgent
        },
        { merge: true }
      );

      console.log("Token saved to Firestore");
    }

    return token;

  } catch (error) {
    console.error("Notification setup error:", error);
    return null;
  }
}

/* Foreground Notification Handler */
export async function onForegroundMessage(callback) {

  const supported = await isSupported();
  if (!supported) return;

  const messaging = getMessaging(app);

  onMessage(messaging, (payload) => {

    console.log("Foreground notification:", payload);

    const notification = payload.notification;

    if (notification) {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || "/icon-192.png"
      });
    }

    if (callback) callback(payload);

  });

}

export { app, db };
