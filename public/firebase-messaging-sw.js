/* Firebase Service Worker for Push Notifications */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

/* Initialize Firebase */
firebase.initializeApp({
  apiKey: "AIzaSyDzyWDeWecDdgIXmqQB01xexaVTjOFFfvE",
  authDomain: "edutrackr-5def9.firebaseapp.com",
  projectId: "edutrackr-5def9",
  storageBucket: "edutrackr-5def9.firebasestorage.app",
  messagingSenderId: "315009933456",
  appId: "1:315009933456:web:afafcaf3e17035bd1eb815"
});

/* Initialize Messaging */
const messaging = firebase.messaging();

/* Handle Background Notifications */
messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);

  const notificationTitle = payload.notification?.title || "AcadeMe";
  const notificationOptions = {
    body: payload.notification?.body || "New update available.",
    icon: payload.notification?.icon || "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: {
      url: "https://acade-me.vercel.app"
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

/* Handle Notification Click */
self.addEventListener("notificationclick", function(event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "https://acade-me.vercel.app";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

/* Activate Service Worker Immediately */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
