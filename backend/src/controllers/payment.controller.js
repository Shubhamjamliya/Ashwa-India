const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/payment.service');
const PaymentIntent = require('../models/PaymentIntent');
const PaymentWebhookEvent = require('../models/PaymentWebhookEvent');
const { createRazorpayOrder, verifyPaymentSignature } = require('../utils/razorpay');

// GET /api/payments/wallet
exports.getMyWallet = asyncHandler(async (req, res) => {
  const wallet = await paymentService.getOrCreateWallet(req.role, req.user._id);
  res.json({ wallet });
});

// GET /api/payments/wallet/transactions
exports.getMyWalletTransactions = asyncHandler(async (req, res) => {
  const wallet = await paymentService.getOrCreateWallet(req.role, req.user._id);
  const transactions = await paymentService.getWalletTransactions(req.role, wallet._id);
  res.json({ transactions });
});

// POST /api/payments/wallet/topup/razorpay-order  { amount }
exports.createTopupOrder = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ message: 'A positive amount is required' });

  const intent = await paymentService.createIntent({
    idempotencyKey: req.body.idempotencyKey,
    payerType: req.role,
    payerId: req.user._id,
    purpose: 'wallet-topup',
    amount,
    method: 'razorpay',
  });

  if (intent.status === 'paid') {
    return res.status(400).json({ message: 'This top-up has already been completed' });
  }

  const razorpayOrder = await createRazorpayOrder({
    amount: intent.amount,
    receipt: `topup_${intent._id}`,
    notes: { intentId: String(intent._id), payerType: req.role, payerId: String(req.user._id) },
  });

  await paymentService.markIntentPendingRazorpay(intent._id, razorpayOrder.id);

  res.json({
    paymentIntentId: intent._id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// POST /api/payments/wallet/topup/verify  { paymentIntentId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
exports.verifyTopup = asyncHandler(async (req, res) => {
  const { paymentIntentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const valid = verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
  if (!valid) return res.status(400).json({ message: 'Payment verification failed' });

  const intent = await PaymentIntent.findById(paymentIntentId);
  if (!intent) return res.status(404).json({ message: 'Payment not found' });
  if (String(intent.payerId) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your payment' });
  }
  if (intent.status === 'paid') {
    const wallet = await paymentService.getOrCreateWallet(req.role, req.user._id);
    return res.json({ wallet });
  }

  await paymentService.markIntentPaid(intent._id, { razorpayPaymentId, razorpaySignature });
  const { wallet } = await paymentService.creditWallet(req.role, req.user._id, intent.amount, {
    paymentIntentId: intent._id,
    description: 'Wallet top-up',
  });

  res.json({ wallet });
});

// POST /api/payments/webhook/razorpay — mounted with a raw body parser (see
// app.js) so the HMAC signature can be verified against the exact bytes sent.
exports.handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  if (!secret) {
    // Webhook not configured — ack so Razorpay stops retrying, but do nothing.
    return res.status(200).json({ received: true, processed: false });
  }

  const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
  if (expected !== signature) {
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  const payload = JSON.parse(req.body.toString('utf8'));
  const eventId =
    req.headers['x-razorpay-event-id'] ||
    `${payload.event}:${payload.payload?.payment?.entity?.id || payload.payload?.order?.entity?.id || Date.now()}`;

  // Dedupe — Razorpay redelivers events, this unique index is what makes
  // processing idempotent, not any logic below.
  let eventDoc;
  try {
    eventDoc = await PaymentWebhookEvent.create({
      eventId,
      type: payload.event,
      payload,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(200).json({ received: true, duplicate: true });
    throw err;
  }

  try {
    if (payload.event === 'payment.captured') {
      const razorpayOrderId = payload.payload?.payment?.entity?.order_id;
      const razorpayPaymentId = payload.payload?.payment?.entity?.id;
      if (razorpayOrderId) {
        const intent = await PaymentIntent.findOne({ 'razorpay.orderId': razorpayOrderId });
        if (intent && intent.status !== 'paid') {
          await paymentService.markIntentPaid(intent._id, { razorpayPaymentId });
        }
      }
    }
    eventDoc.processed = true;
    eventDoc.processedAt = new Date();
    await eventDoc.save();
  } catch (err) {
    eventDoc.processingError = err.message;
    await eventDoc.save();
  }

  res.status(200).json({ received: true });
});
