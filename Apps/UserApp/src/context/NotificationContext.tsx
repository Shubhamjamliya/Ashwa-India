import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../services/api';
import { useAuth } from './AuthContext';

const DISMISSED_KEY = 'ashwa_user_notifications_dismissed';

export type AppNotification = {
  _id: string;
  title: string;
  message: string;
  audience: string;
  createdAt: string;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  dismiss: (id: string) => void;
  dismissAll: () => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [all, setAll] = useState<AppNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then(raw => {
        if (raw) setDismissedIds(JSON.parse(raw));
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedIds)).catch(() => {});
  }, [dismissedIds, hydrated]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ notifications: AppNotification[] }>('/notifications');
      setAll(data.notifications);
    } catch (e) {
      // ignore — keep whatever we already had
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) refresh();
    else setAll([]);
  }, [isAuthenticated, refresh]);

  const notifications = all.filter(n => !dismissedIds.includes(n._id));

  const dismiss = useCallback((id: string) => {
    setDismissedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const dismissAll = useCallback(() => {
    setDismissedIds(prev => Array.from(new Set([...prev, ...all.map(n => n._id)])));
  }, [all]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount: notifications.length, loading, refresh, dismiss, dismissAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
