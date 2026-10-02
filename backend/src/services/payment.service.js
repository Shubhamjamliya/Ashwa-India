const mongoose = require('mongoose');
const PaymentIntent = require('../models/PaymentIntent');
const PaymentTransaction = require('../models/PaymentTransaction');
const PaymentUserWallet = require('../models/PaymentUserWallet');
const PaymentTransporterWallet = require('../models/PaymentTransporterWallet');
const PaymentProviderWallet = require('../models/PaymentProviderWallet');
const PaymentStoreSellerWallet = require('../models/PaymentStoreSellerWallet');
const PaymentHorseSellerWallet = require('../models/PaymentHorseSellerWallet');

const WALLET_MODELS = {
  user: PaymentUserWallet,
  transporter: PaymentTransporterWallet,
  provider: PaymentProviderWallet,
  'store-seller': PaymentStoreSellerWallet,
  'horse-seller': PaymentHorseSellerWallet,
};

function getWalletModel(walletType) {
  const Model = WALLET_MODELS[walletType];
  if (!Model) throw new Error(`Unknown wallet type: ${walletType}`);
  return Model;
}

// Idempotent: a retried request with the same key always returns the
// existing intent instead of creating a duplicate payment attempt.
async function createIntent({ idempotencyKey, payerType, payerId, purpose, amount, method, referenceType, referenceId }) {
  if (idempotencyKey) {
    const existing = await PaymentIntent.findOne({ idempotencyKey });
    if (existing) return existing;
  }

  return PaymentIntent.create({
    idempotencyKey,
    payerType,
    payerId,
    purpose,
    amount,
    method,
    referenceType,
    referenceId,
    status: 'created',
  });
}

async function attachReference(intentId, referenceType, referenceId) {
  await PaymentIntent.findByIdAndUpdate(intentId, { referenceType, referenceId });
}

async function markIntentPendingRazorpay(intentId, razorpayOrderId) {
  await PaymentIntent.findByIdAndUpdate(intentId, {
    status: 'pending',
    'razorpay.orderId': razorpayOrderId,
  });
}

// Settles the intent and writes the one immutable ledger row for the charge.
// Call this exactly once per intent (guard with intent.status !== 'paid' at
// the call site) — it does not itself dedupe.
async function markIntentPaid(intentId, { razorpayPaymentId, razorpaySignature } = {}) {
  const intent = await PaymentIntent.findByIdAndUpdate(
    intentId,
    {
      status: 'paid',
      ...(razorpayPaymentId ? { 'razorpay.paymentId': razorpayPaymentId } : {}),
      ...(razorpaySignature ? { 'razorpay.signature': razorpaySignature } : {}),
    },
    { new: true }
  );
  if (!intent) throw new Error('PaymentIntent not found');

  await PaymentTransaction.create({
    type: 'charge',
    amount: intent.amount,
    currency: intent.currency,
    paymentIntent: intent._id,
    description: `${intent.purpose} charge`,
  });

  return intent;
}

async function markIntentFailed(intentId, reason) {
  return PaymentIntent.findByIdAndUpdate(intentId, { status: 'failed', failureReason: reason }, { new: true });
}

async function getOrCreateWallet(walletType, ownerId, session) {
  const Model = getWalletModel(walletType);
  const wallet = await Model.findOneAndUpdate(
    { owner: ownerId },
    { $setOnInsert: { owner: ownerId, balance: 0 } },
    { upsert: true, new: true, session }
  );
  return wallet;
}

// Credits a wallet and writes the matching ledger row atomically — both
// happen in the same DB transaction, so the cached balance can never drift
// from the ledger that's supposed to explain it.
async function creditWallet(walletType, ownerId, amount, { paymentIntentId, description } = {}) {
  if (amount <= 0) throw new Error('Credit amount must be positive');
  const Model = getWalletModel(walletType);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const wallet = await getOrCreateWallet(walletType, ownerId, session);
      const updated = await Model.findByIdAndUpdate(
        wallet._id,
        { $inc: { balance: amount } },
        { new: true, session }
      );
      const [txn] = await PaymentTransaction.create(
        [
          {
            type: 'wallet_credit',
            amount,
            paymentIntent: paymentIntentId,
            walletType,
            walletId: updated._id,
            balanceAfter: updated.balance,
            description,
          },
        ],
        { session }
      );
      result = { wallet: updated, transaction: txn };
    });
    return result;
  } finally {
    session.endSession();
  }
}

// Debits a wallet atomically, rejecting if the balance can't cover it — the
// balance check and the decrement happen as one conditional update inside the
// transaction so two concurrent debits can't both succeed past zero.
async function debitWallet(walletType, ownerId, amount, { paymentIntentId, description } = {}) {
  if (amount <= 0) throw new Error('Debit amount must be positive');
  const Model = getWalletModel(walletType);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const wallet = await getOrCreateWallet(walletType, ownerId, session);
      const updated = await Model.findOneAndUpdate(
        { _id: wallet._id, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true, session }
      );
      if (!updated) {
        const err = new Error('Insufficient wallet balance');
        err.status = 400;
        throw err;
      }
      const [txn] = await PaymentTransaction.create(
        [
          {
            type: 'wallet_debit',
            amount,
            paymentIntent: paymentIntentId,
            walletType,
            walletId: updated._id,
            balanceAfter: updated.balance,
            description,
          },
        ],
        { session }
      );
      result = { wallet: updated, transaction: txn };
    });
    return result;
  } finally {
    session.endSession();
  }
}

// Pays an intent entirely from a wallet: debit + mark-paid in one place so
// callers can't accidentally do one without the other.
async function payIntentFromWallet(intentId, walletType, ownerId) {
  const intent = await PaymentIntent.findById(intentId);
  if (!intent) throw new Error('PaymentIntent not found');
  if (intent.status === 'paid') return intent;

  await debitWallet(walletType, ownerId, intent.amount, {
    paymentIntentId: intent._id,
    description: `${intent.purpose} payment via wallet`,
  });

  return PaymentIntent.findByIdAndUpdate(intentId, { status: 'paid', method: 'wallet' }, { new: true });
}

// Credits a seller/payee wallet for a settled sale — e.g. called when an
// order moves to 'delivered'. Separate `type: 'payout'` row so it's
// distinguishable in the ledger from a user topping up their own wallet.
async function payout(walletType, ownerId, amount, { paymentIntentId, description } = {}) {
  if (amount <= 0) throw new Error('Payout amount must be positive');
  const Model = getWalletModel(walletType);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const wallet = await getOrCreateWallet(walletType, ownerId, session);
      const updated = await Model.findByIdAndUpdate(
        wallet._id,
        { $inc: { balance: amount } },
        { new: true, session }
      );
      const [txn] = await PaymentTransaction.create(
        [
          {
            type: 'payout',
            amount,
            paymentIntent: paymentIntentId,
            walletType,
            walletId: updated._id,
            balanceAfter: updated.balance,
            description,
          },
        ],
        { session }
      );
      result = { wallet: updated, transaction: txn };
    });
    return result;
  } finally {
    session.endSession();
  }
}

async function getWalletTransactions(walletType, walletId, { limit = 50 } = {}) {
  return PaymentTransaction.find({ walletType, walletId }).sort({ createdAt: -1 }).limit(limit);
}

module.exports = {
  getWalletModel,
  createIntent,
  attachReference,
  markIntentPendingRazorpay,
  markIntentPaid,
  markIntentFailed,
  getOrCreateWallet,
  creditWallet,
  debitWallet,
  payIntentFromWallet,
  payout,
  getWalletTransactions,
};
