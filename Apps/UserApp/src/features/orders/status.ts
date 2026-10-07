import type { OrderStatus } from '../store/types';

// Same labels and colours as the web order pages.
export const ORDER_STATUS: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Placed', color: '#f59e0b' },
  processing: { label: 'Processing', color: '#0ea5e9' },
  shipped: { label: 'Shipped', color: '#0ea5e9' },
  delivered: { label: 'Delivered', color: '#16a34a' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
  returned: { label: 'Returned', color: '#ef4444' },
};
