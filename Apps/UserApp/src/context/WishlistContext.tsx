import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../services/api';
import { useAuth } from './AuthContext';
import type { Horse } from '../features/marketplace/types';
import type { Product } from '../features/store/types';

// Earlier app versions kept saved horses on the phone only; they move to the account once.
const LEGACY_KEY = 'ashwa_user_wishlist';

type WishlistContextValue = {
  horses: Horse[];
  products: Product[];
  isSaved: (horseId: string) => boolean;
  toggle: (horse: Horse) => void;
  isSavedProduct: (productId: string) => boolean;
  toggleProduct: (product: Product) => void;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

// Saved horses and saved products live on the account, so they follow the user across devices
// (and match the web). Toggles update the screen straight away and roll back if the server says no.
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!user) {
      setHorses([]);
      setProducts([]);
      return;
    }
    let active = true;
    (async () => {
      const [horsesRes, productsRes] = await Promise.allSettled([
        apiFetch<{ horses: Horse[] }>('/marketplace/favourites'),
        apiFetch<{ products: Product[] }>('/store/favourites'),
      ]);
      let saved = horsesRes.status === 'fulfilled' ? horsesRes.value.horses || [] : [];
      if (productsRes.status === 'fulfilled' && active) setProducts(productsRes.value.products || []);

      const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY).catch(() => null);
      if (legacyRaw && horsesRes.status === 'fulfilled') {
        const legacy = (JSON.parse(legacyRaw) as Horse[]).filter(h => !saved.some(s => s._id === h._id));
        for (const horse of legacy) {
          try {
            await apiFetch(`/marketplace/favourites/${horse._id}/toggle`, { method: 'POST' });
            saved = [...saved, horse];
          } catch {
            // The listing may be gone; skip it.
          }
        }
        await AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
      }
      if (active) setHorses(saved);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const isSaved = useCallback((horseId: string) => horses.some(h => h._id === horseId), [horses]);
  const isSavedProduct = useCallback((productId: string) => products.some(p => p._id === productId), [products]);

  const toggle = useCallback(
    async (horse: Horse) => {
      const wasSaved = horses.some(h => h._id === horse._id);
      setHorses(prev => (wasSaved ? prev.filter(h => h._id !== horse._id) : [...prev, horse]));
      try {
        await apiFetch(`/marketplace/favourites/${horse._id}/toggle`, { method: 'POST' });
      } catch {
        setHorses(prev => (wasSaved ? [...prev, horse] : prev.filter(h => h._id !== horse._id)));
      }
    },
    [horses],
  );

  const toggleProduct = useCallback(
    async (product: Product) => {
      const wasSaved = products.some(p => p._id === product._id);
      setProducts(prev => (wasSaved ? prev.filter(p => p._id !== product._id) : [...prev, product]));
      try {
        await apiFetch(`/store/favourites/${product._id}/toggle`, { method: 'POST' });
      } catch {
        setProducts(prev => (wasSaved ? [...prev, product] : prev.filter(p => p._id !== product._id)));
      }
    },
    [products],
  );

  return (
    <WishlistContext.Provider value={{ horses, products, isSaved, toggle, isSavedProduct, toggleProduct }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
