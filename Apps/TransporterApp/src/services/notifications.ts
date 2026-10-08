import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './api';

const DISMISSED_KEY = 'ashwa_transporter_notifications_dismissed';

export type AppNotification = { _id: string; title: string; message: string; createdAt: string };

// Notifications the transporter cleared stay hidden on this phone (same as the web).
export async function getDismissed(): Promise<string[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(DISMISSED_KEY)) || '[]');
  } catch {
    return [];
  }
}

export function setDismissed(ids: string[]) {
  return AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(ids)).catch(() => {});
}

export async function countUnread(): Promise<number> {
  const [data, dismissed] = await Promise.all([
    apiFetch<{ notifications: AppNotification[] }>('/notifications'),
    getDismissed(),
  ]);
  return (data.notifications || []).filter(n => !dismissed.includes(n._id)).length;
}
