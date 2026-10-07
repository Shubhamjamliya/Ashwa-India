import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product, ProductVariant } from '../features/store/types';

const CART_KEY = 'ashwa_user_cart';

// A cart line is one product in one option (variant), so the same product can appear in several sizes.
export const lineKey = (productId: string, variantId?: string | null) => `${productId}:${variantId || ''}`;

export type CartItem = {
  key: string;
  product: Product;
  variant: ProductVariant | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalCount: number;
  totalAmount: number;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant | null) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearSeller: (sellerId: string) => void;
  unitPrice: (item: CartItem) => number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const unitPrice = (i: CartItem) => (i.variant && i.variant.price != null ? i.variant.price : i.product.price);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY)
      .then(raw => {
        if (!raw) return;
        // Lines saved before options existed have no key; they become the product's plain line.
        const saved = JSON.parse(raw) as Partial<CartItem>[];
        setItems(
          saved
            .filter(i => i.product?._id)
            .map(i => ({
              key: i.key || lineKey(i.product!._id, i.variant?._id),
              product: i.product!,
              variant: i.variant ?? null,
              quantity: i.quantity || 1,
            })),
        );
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(CART_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, hydrated]);

  const addItem = useCallback((product: Product, quantity = 1, variant: ProductVariant | null = null) => {
    const key = lineKey(product._id, variant?._id);
    setItems(prev => {
      const existing = prev.find(i => i.key === key);
      if (existing) return prev.map(i => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i));
      return [...prev, { key, product, variant, quantity }];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems(prev => prev.filter(i => i.key !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.key !== key));
      return;
    }
    setItems(prev => prev.map(i => (i.key === key ? { ...i, quantity } : i)));
  }, []);

  // Removes only one seller's lines, so checking out one seller leaves the others in the cart.
  const clearSeller = useCallback((sellerId: string) => {
    setItems(prev => prev.filter(i => i.product.seller?._id !== sellerId));
  }, []);

  const totalCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  // Display only. The server prices every order again before charging.
  const totalAmount = useMemo(() => items.reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, totalCount, totalAmount, addItem, removeItem, updateQuantity, clearSeller, unitPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
