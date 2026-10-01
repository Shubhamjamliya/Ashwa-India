import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Horse } from '../features/marketplace/types';

const WISHLIST_KEY = 'ashwa_user_wishlist';

type WishlistContextValue = {
  horses: Horse[];
  isSaved: (horseId: string) => boolean;
  toggle: (horse: Horse) => void;
  remove: (horseId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(WISHLIST_KEY)
      .then(raw => {
        if (raw) setHorses(JSON.parse(raw));
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(horses)).catch(() => {});
  }, [horses, hydrated]);

  const isSaved = useCallback((horseId: string) => horses.some(h => h._id === horseId), [horses]);

  const toggle = useCallback((horse: Horse) => {
    setHorses(prev =>
      prev.some(h => h._id === horse._id)
        ? prev.filter(h => h._id !== horse._id)
        : [horse, ...prev]
    );
  }, []);

  const remove = useCallback((horseId: string) => {
    setHorses(prev => prev.filter(h => h._id !== horseId));
  }, []);

  return (
    <WishlistContext.Provider value={{ horses, isSaved, toggle, remove }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
