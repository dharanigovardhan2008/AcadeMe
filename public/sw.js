const CACHE_NAME = "acade-me-cache-v1";

/* Install */
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installed");
  self.skipWaiting();
});

/* Activate */
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activated");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

/* Fetch (offline support) */
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

/* Firebase Messaging */
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

/* Firebase config */
firebase.initializeApp({
  apiKey: "AIzaSyDzyWDeWecDdgIXmqQB01xexaVTjOFFfvE",
  authDomain: "edutrackr-5def9.firebaseapp.com",
  projectId: "edutrackr-5def9",
  storageBucket: "edutrackr-5def9.firebasestorage.app",
  messagingSenderId: "315009933456",
  appId: "1:315009933456:web:afafcaf3e17035bd1eb815"
});

const messaging = firebase.messaging();

/* Background Notifications */
messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);

  const title = payload.notification?.title || "AcadeMe";
  const options = {
    body: payload.notification?.body || "New update available",
    icon: "/icon-192.png",
    data: {
      url: "https://acade-me.vercel.app"
    }
  };

  self.registration.showNotification(title, options);
});

/* Notification click */
self.addEventListener("notificationclick", function(event) {
  event.notification.close();

  const url = event.notification.data?.url || "https://acade-me.vercel.app";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
