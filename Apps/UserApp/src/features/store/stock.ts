import type { Product } from './types';

// Stock wording shared by the shop cards and the product page.
export function stockText(stock: number): { text: string; color: string } {
  if (stock <= 0) return { text: 'Out of stock', color: '#ef4444' };
  if (stock <= 5) return { text: `Only ${stock} left`, color: '#D97706' };
  return { text: 'In stock', color: '#059669' };
}

// A product with options sells each option's stock; otherwise its own.
export const productStock = (p: Product) =>
  p.variants?.length ? p.variants.reduce((sum, v) => sum + v.stock, 0) : p.stock;
