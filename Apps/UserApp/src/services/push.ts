import { Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  registerDeviceForRemoteMessages,
  getToken,
  deleteToken,
  onTokenRefresh,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { apiFetch } from './api';

const messaging = () => getMessaging(getApp());

// Requests notification permission, fetches an FCM token and saves it
// against the currently-authenticated account. Safe to call on every app
// start/login — the backend just dedupes via $addToSet.
export async function registerPushToken(): Promise<void> {
  try {
    const authStatus = await requestPermission(messaging());
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;
    if (!enabled) return;

    if (Platform.OS === 'android') {
      await registerDeviceForRemoteMessages(messaging());
    }

    const token = await getToken(messaging());
    if (!token) return;

    await apiFetch('/notifications/fcm-token', { method: 'POST', body: { token } });
  } catch (e) {
    // Non-fatal — push is a nice-to-have, never block app usage on it.
    console.warn('Push registration failed:', e);
  }
}

export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await getToken(messaging());
    if (!token) return;
    await apiFetch('/notifications/fcm-token', { method: 'DELETE', body: { token } });
    await deleteToken(messaging());
  } catch (e) {
    // ignore — best-effort cleanup on logout
  }
}

// Call once near app startup. Listens for token refreshes (Firebase rotates
// tokens occasionally) and keeps the backend's copy in sync.
export function listenForTokenRefresh(): () => void {
  return onTokenRefresh(messaging(), async token => {
    try {
      await apiFetch('/notifications/fcm-token', { method: 'POST', body: { token } });
    } catch (e) {
      // ignore
    }
  });
}
