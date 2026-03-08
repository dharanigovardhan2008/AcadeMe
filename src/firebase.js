import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth           = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db             = getFirestore(app);

// ✅ Fix Bug #7 — getMessaging() was called at module level, crashing Safari/Firefox/iOS.
// Now lazy-initialized only when the browser actually supports FCM.
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
            console.log("FCM not supported in this browser.");
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.log("Notification permission denied.");
            return null;
        }

        const registration = await navigator.serviceWorker.register("/sw.js");
        const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (token && userId) {
            await setDoc(
                doc(db, "users", userId),
                { fcmToken: token, notificationsEnabled: true },
                { merge: true }
            );
            console.log("FCM token saved:", token);
            return token;
        }
    } catch (error) {
        console.error("Error getting notification permission:", error);
    }
    return null;
};

export const onForegroundMessage = async (callback) => {
    const messaging = await getMessagingInstance();
    if (!messaging) return;
    onMessage(messaging, callback);
};
