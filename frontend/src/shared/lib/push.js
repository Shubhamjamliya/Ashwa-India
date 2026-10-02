import { initializeApp, getApps } from "firebase/app"
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging"
import { apiFetch } from "./api"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

let appInstance = null
function getFirebaseApp() {
  if (!appInstance) {
    appInstance = getApps()[0] || initializeApp(firebaseConfig)
  }
  return appInstance
}

// Requests notification permission, registers the service worker, fetches an
// FCM token and saves it against whichever role is currently logged in. Safe
// to call repeatedly — browsers return the same token until it's invalidated.
export async function registerPushToken() {
  try {
    if (!(await isSupported())) return null
    if (!("serviceWorker" in navigator)) return null

    const permission = await Notification.requestPermission()
    if (permission !== "granted") return null

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
    const messaging = getMessaging(getFirebaseApp())
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration })
    if (!token) return null

    await apiFetch("/notifications/fcm-token", { method: "POST", body: { token } })
    return token
  } catch (e) {
    console.warn("Push registration failed:", e.message)
    return null
  }
}

// Foreground messages (tab open and focused) don't trigger the service
// worker's background handler — this is how those get surfaced instead.
export async function onForegroundPush(callback) {
  if (!(await isSupported())) return () => {}
  const messaging = getMessaging(getFirebaseApp())
  return onMessage(messaging, callback)
}
