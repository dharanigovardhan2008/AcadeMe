/* Firebase imports FIRST */
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDzyWDeWecDdgIXmqQB01xexaVTjOFFfvE",
  authDomain: "edutrackr-5def9.firebaseapp.com",
  projectId: "edutrackr-5def9",
  storageBucket: "edutrackr-5def9.firebasestorage.app",
  messagingSenderId: "315009933456",
  appId: "1:315009933456:web:afafcaf3e17035bd1eb815"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Background notification:", payload);

  const title = payload.notification?.title || "AcadeMe";
  const options = {
    body: payload.notification?.body || "New update",
    icon: "/icon-192.png",
    badge: "/badge-96.png",
    tag: "acade-me-" + Date.now(),
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { url: "https://acade-me.vercel.app" }
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "https://acade-me.vercel.app";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("acade-me") && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

/* Cache */
const CACHE_NAME = "acade-me-v3";

self.addEventListener("install", (e) => {
  console.log("SW installed");
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  e.waitUntil(clients.claim());
});

self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
