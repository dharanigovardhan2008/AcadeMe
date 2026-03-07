// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDzyWDeWecDdgIXmqQB01xexaVTjOFFfvE",
  authDomain: "edutrackr-5def9.firebaseapp.com",
  projectId: "edutrackr-5def9",
  storageBucket: "edutrackr-5def9.firebasestorage.app",
  messagingSenderId: "315009933456",
  appId: "1:315009933456:web:afafcaf3e17035bd1eb815",
  measurementId: "G-206PV4KM9T"
});

const messaging = firebase.messaging();

// Background message handler - fires when app is closed/in background
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message received:", payload);

  const { title, body, icon, image, click_action } = payload.notification || {};
  const data = payload.data || {};

  const notificationTitle = title || data.title || "AcadeMe";
  const notificationOptions = {
    body: body || data.body || "You have a new announcement.",
    icon: icon || data.icon || "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    image: image || data.image || undefined,
    tag: data.tag || "academe-announcement",
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200, 100, 200],
    sound: "default",
    data: {
      click_action: click_action || data.click_action || "https://acade-me.vercel.app/announcements",
      url: click_action || data.url || "https://acade-me.vercel.app/announcements"
    },
    actions: [
      {
        action: "open",
        title: "View Announcement"
      },
      {
        action: "dismiss",
        title: "Dismiss"
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const urlToOpen = event.notification.data?.url || "https://acade-me.vercel.app/announcements";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes("acade-me.vercel.app") && "focus" in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Push event fallback (if onBackgroundMessage doesn't fire)
self.addEventListener("push", (event) => {
  if (event.data) {
    let payload;
    try {
      payload = event.data.json();
    } catch {
      payload = { notification: { title: "AcadeMe", body: event.data.text() } };
    }

    const notification = payload.notification || {};
    const data = payload.data || {};

    const title = notification.title || data.title || "AcadeMe";
    const options = {
      body: notification.body || data.body || "New announcement posted.",
      icon: notification.icon || "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      tag: "academe-announcement",
      renotify: true,
      vibrate: [200, 100, 200],
      data: {
        url: notification.click_action || data.url || "https://acade-me.vercel.app/announcements"
      }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});
