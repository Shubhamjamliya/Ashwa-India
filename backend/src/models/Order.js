const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreSeller', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 },
        price: { type: Number },
      },
    ],
    total: { type: Number, required: true },
    shippingAddress: {
      label: String,
      line1: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    // Payment data lives entirely in PaymentIntent/PaymentTransaction — this
    // is just a pointer, not a second copy of the truth. Populate it to read
    // payment state; see the `paymentStatus` virtual below for convenience.
    paymentIntent: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentIntent' },
    // Set once, when the seller's wallet has been credited for this order
    // (on delivery) — guards against crediting the payout twice.
    payoutCompletedAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Only resolves when paymentIntent has been populated — callers that need
// payment status must `.populate('paymentIntent')`.
orderSchema.virtual('paymentStatus').get(function paymentStatus() {
  if (!this.paymentIntent || typeof this.paymentIntent !== 'object') return undefined;
  return this.paymentIntent.status;
});

module.exports = mongoose.model('Order', orderSchema);
