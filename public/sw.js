const CACHE_NAME = "edutrackr-v1";

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

/* Fetch (cache support) */
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

/* Firebase */
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDzyWDeWecDdgIXmqQB01xexaVTjOFFfvE",
  authDomain: "edutrackr-5def9.firebaseapp.com",
  projectId: "edutrackr-5def9",
  messagingSenderId: "315009933456",
  appId: "1:315009933456:web:afafcaf3e17035bd1eb815"
});

const messaging = firebase.messaging();

/* Background Notification */
messaging.onBackgroundMessage((payload) => {
  console.log("Background message:", payload);

  const notificationTitle = payload.notification?.title || "AcadeMe";

  const notificationOptions = {
    body: payload.notification?.body || "New update available",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: {
      url: "https://acade-me.vercel.app"
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

/* Notification click */
self.addEventListener("notificationclick", function(event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "https://acade-me.vercel.app";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
