const mongoose = require('mongoose');

// Single source of truth for one payment attempt. Created BEFORE any money
// moves, so a retried/duplicate client request (same idempotencyKey) always
// resolves to the same intent instead of charging twice or creating two orders.
const paymentIntentSchema = new mongoose.Schema(
  {
    idempotencyKey: { type: String, unique: true, sparse: true, index: true },

    payerType: {
      type: String,
      enum: ['user', 'transporter', 'provider', 'store-seller', 'horse-seller'],
      required: true,
    },
    payerId: { type: mongoose.Schema.Types.ObjectId, required: true },

    purpose: {
      type: String,
      enum: ['store-order', 'transport-booking', 'wallet-topup'],
      required: true,
    },

    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    method: { type: String, enum: ['razorpay', 'wallet', 'mixed'], required: true },
    // For 'mixed' payments — how much of `amount` came out of the wallet vs the gateway.
    walletAmountUsed: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['created', 'pending', 'paid', 'failed', 'cancelled', 'refunded'],
      default: 'created',
    },
    failureReason: { type: String },

    // What this payment is actually for — e.g. an Order or a TransportRequest.
    // Set once the domain record is created (chicken-and-egg: the intent
    // usually exists before the Order does).
    referenceType: { type: String, enum: ['Order', 'TransportRequest'] },
    referenceId: { type: mongoose.Schema.Types.ObjectId, refPath: 'referenceType' },

    razorpay: {
      orderId: String,
      paymentId: String,
      signature: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentIntent', paymentIntentSchema);
