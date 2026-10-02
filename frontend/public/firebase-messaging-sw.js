// Firebase web config values are public/client-side by design (not secrets),
// so it's safe to inline them here — a service worker can't read Vite's
// import.meta.env at runtime, only plain script content.
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: "AIzaSyDeNElN-TNA-FSKnItToFsXLFZbBtXb2ww",
  authDomain: "ashwa-india.firebaseapp.com",
  projectId: "ashwa-india",
  storageBucket: "ashwa-india.firebasestorage.app",
  messagingSenderId: "685172070077",
  appId: "1:685172070077:web:7bee621ce85d83d93709d4",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  self.registration.showNotification(title || "Ashwa India", {
    body,
    icon: "/favicon.svg",
    data: payload.data,
  })
})
