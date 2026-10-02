import { Platform } from 'react-native';
import { apiFetch } from './api';
import type { SessionUser } from './storage';
import type { RazorpaySuccess } from 'react-native-razorpay';

type CartLineItem = { productId: string; quantity: number };

type PaymentOrderResponse = {
  paymentIntentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

export async function payForCart(
  items: CartLineItem[],
  user: SessionUser | null,
): Promise<{ paymentIntentId: string; result: RazorpaySuccess }> {
  if (Platform.OS === 'web') {
    throw new Error('Payments are only available in the Ashwa India mobile app, not this web preview.');
  }

  const order = await apiFetch<PaymentOrderResponse>('/store/payments/razorpay-order', {
    method: 'POST',
    body: { items },
  });

  const { default: RazorpayCheckout } = await import('react-native-razorpay');

  const result = await RazorpayCheckout.open({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.razorpayOrderId,
    name: 'Ashwa India',
    description: 'Accessories Store purchase',
    prefill: {
      name: user?.name,
      contact: user?.phone,
    },
    theme: { color: '#C28D2E' },
  });

  return { paymentIntentId: order.paymentIntentId, result };
}
