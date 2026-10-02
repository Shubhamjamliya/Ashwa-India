const mongoose = require('mongoose');

const WALLET_TYPES = ['user', 'transporter', 'provider', 'store-seller', 'horse-seller'];

// The ledger. Append-only — every money movement in the system (a charge
// settling, a refund, a wallet top-up, a wallet debit, a seller payout) is one
// row here and rows are never edited, only inserted. This is what you
// reconcile against, not PaymentIntent.status or a wallet's `balance` field.
const paymentTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['charge', 'refund', 'wallet_credit', 'wallet_debit', 'payout'],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    paymentIntent: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentIntent' },

    // Only set for wallet_credit/wallet_debit/payout rows.
    walletType: { type: String, enum: WALLET_TYPES },
    walletId: { type: mongoose.Schema.Types.ObjectId },
    // Snapshot of the wallet's balance right after this row was applied —
    // lets you audit/replay history without recomputing from scratch.
    balanceAfter: { type: Number },

    description: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

paymentTransactionSchema.index({ paymentIntent: 1 });
paymentTransactionSchema.index({ walletType: 1, walletId: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
module.exports.WALLET_TYPES = WALLET_TYPES;
