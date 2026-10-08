import { apiFetch } from './api';
import type { SessionUser } from './storage';

type PaymentOrderResponse = {
  paymentIntentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

// Adds money to the wallet: opens Razorpay, then has the backend verify the payment.
export async function topUpWallet(amount: number, user: SessionUser | null): Promise<void> {
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
    name: 'Ashwa India Transporter',
    description: 'Wallet top-up',
    prefill: { name: user?.name, contact: user?.phone },
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
