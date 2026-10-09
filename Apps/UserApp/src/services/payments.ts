import { Platform } from 'react-native';
import { apiFetch } from './api';
import type { SessionUser } from './storage';
import type { RazorpaySuccess } from 'react-native-razorpay';

// One cart line as the server prices it. All lines in one payment must be from one seller.
export type CartLineItem = { productId: string; variantId?: string; quantity: number };

type PaymentOrderResponse = {
  paymentIntentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

function assertNative() {
  if (Platform.OS === 'web') {
    throw new Error('Payments are only available in the Ashwa India mobile app, not this web preview.');
  }
}

// Pays for one seller's cart with Razorpay. The order itself is created afterwards with this proof.
export async function payForCart(
  items: CartLineItem[],
  user: SessionUser | null,
  couponCode?: string,
): Promise<{ paymentIntentId: string; result: RazorpaySuccess }> {
  assertNative();

  const order = await apiFetch<PaymentOrderResponse>('/store/payments/razorpay-order', {
    method: 'POST',
    body: { items, couponCode },
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

// Pays a transport booking's advance with Razorpay. The booking itself is created afterwards with this proof.
// `booking` is the same body the booking request takes.
export async function payTransportAdvance(
  booking: Record<string, unknown>,
  user: SessionUser | null,
): Promise<{ paymentIntentId: string; result: RazorpaySuccess }> {
  assertNative();

  const order = await apiFetch<PaymentOrderResponse>('/transport/advance/razorpay-order', {
    method: 'POST',
    body: booking,
  });

  const { default: RazorpayCheckout } = await import('react-native-razorpay');

  const result = await RazorpayCheckout.open({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.razorpayOrderId,
    name: 'Ashwa India',
    description: 'Transport booking advance',
    prefill: {
      name: user?.name,
      contact: user?.phone,
    },
    theme: { color: '#C28D2E' },
  });

  return { paymentIntentId: order.paymentIntentId, result };
}

// Adds money to the user's wallet: opens Razorpay, then has the backend verify the payment.
export async function topUpWallet(amount: number, user: SessionUser | null): Promise<void> {
  assertNative();

  const order = await apiFetch<PaymentOrderResponse>('/payments/wallet/topup/razorpay-order', {
    method: 'POST',
    body: { amount },
  });

  const { default: RazorpayCheckout } = await import('react-native-razorpay');

  const result = await RazorpayCheckout.open({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.razorpayOrderId,
    name: 'Ashwa India',
    description: 'Wallet top-up',
    prefill: {
      name: user?.name,
      contact: user?.phone,
    },
    theme: { color: '#C28D2E' },
  });

  await apiFetch('/payments/wallet/topup/verify', {
    method: 'POST',
    body: {
      paymentIntentId: order.paymentIntentId,
      razorpayOrderId: result.razorpay_order_id,
      razorpayPaymentId: result.razorpay_payment_id,
      razorpaySignature: result.razorpay_signature,
    },
  });
}

// Razorpay rejects with { code: 2 } (or a description) when the user closes the payment sheet.
export const isPaymentCancelled = (e: any) => e?.code === 2 || Boolean(e?.description);
