const mongoose = require('mongoose');

// Refunds get their own lifecycle (requested -> processing -> completed/failed)
// separate from the ledger, since a single refund can take multiple gateway
// round-trips before it settles — the ledger only gets a row once it's final.
const paymentRefundSchema = new mongoose.Schema(
  {
    paymentIntent: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentIntent', required: true },
    amount: { type: Number, required: true },
    reason: { type: String },
    status: {
      type: String,
      enum: ['requested', 'processing', 'completed', 'failed'],
      default: 'requested',
    },
    razorpayRefundId: { type: String },
    initiatedByType: { type: String, enum: ['user', 'admin', 'store-seller'] },
    initiatedById: { type: mongoose.Schema.Types.ObjectId },
    failureReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentRefund', paymentRefundSchema);
