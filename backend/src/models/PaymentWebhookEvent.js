const mongoose = require('mongoose');

// Raw gateway webhook log, deduped by the provider's own event id. Gateways
// redeliver events (at-least-once delivery), so this unique index is what
// actually makes webhook handling idempotent — not anything in the handler.
const paymentWebhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['razorpay'], default: 'razorpay' },
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    processed: { type: Boolean, default: false },
    processedAt: { type: Date },
    processingError: { type: String },
  },
  { timestamps: { createdAt: 'receivedAt', updatedAt: true } }
);

module.exports = mongoose.model('PaymentWebhookEvent', paymentWebhookEventSchema);
