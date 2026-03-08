import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyDzyWDeWecDdgIXmqQB01xexaVTjOFFfvE",
    authDomain: "edutrackr-5def9.firebaseapp.com",
    projectId: "edutrackr-5def9",
    storageBucket: "edutrackr-5def9.firebasestorage.app",
    messagingSenderId: "315009933456",
    appId: "1:315009933456:web:afafcaf3e17035bd1eb815",
    measurementId: "G-206PV4KM9T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const messaging = getMessaging(app);

export const requestNotificationPermission = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BO2UR2vUG0XuHYOCO4XzZJQSD3clerf3YEzdyNDqnfmZeLEmiflYu3jnRbiHM-WqtOlC_XDT06uUhLr6WRHxKlM',
        serviceWorkerRegistration: await navigator.serviceWorker.register('/sw.js')
      });
      if (token && userId) {
        await setDoc(doc(db, 'users', userId), 
          { fcmToken: token, notificationsEnabled: true }, 
          { merge: true }
        );
        console.log('FCM token saved:', token);
        return token;
      }
    } else {
      console.log('Notification permission denied');
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
  }
};

export const onForegroundMessage = (callback) => {
  onMessage(messaging, callback);
};

