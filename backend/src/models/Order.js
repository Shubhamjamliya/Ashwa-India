const mongoose = require('mongoose');

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreSeller', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        variantId: { type: mongoose.Schema.Types.ObjectId },
        variantLabel: { type: String },
        quantity: { type: Number, default: 1 },
        price: { type: Number },
      },
    ],
    subtotal: { type: Number },
    couponCode: { type: String },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['razorpay', 'wallet', 'cod'], default: 'razorpay' },
    shippingAddress: {
      label: String,
      line1: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES, required: true },
        at: { type: Date, default: Date.now },
        note: { type: String },
        _id: false,
      },
    ],
    courier: {
      name: { type: String, trim: true },
      trackingNumber: { type: String, trim: true },
    },
    // Payment data lives entirely in PaymentIntent/PaymentTransaction — this
    // is just a pointer, not a second copy of the truth. Populate it to read
    // payment state; see the `paymentStatus` virtual below for convenience.
    // Cash on delivery has no intent.
    paymentIntent: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentIntent' },
    // Commission snapshot written at delivery. Commission reports read it.
    settlement: {
      grossAmount: Number,
      commissionPercent: Number,
      commissionFixed: Number,
      commission: Number,
      netAmount: Number,
      settledAt: Date,
      _id: false,
    },
    // Set once, when the seller's wallet has been credited for this order
    // (on delivery) — guards against crediting the payout twice.
    payoutCompletedAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Only resolves when paymentIntent has been populated — callers that need
// payment status must `.populate('paymentIntent')`. COD orders have no intent,
// so their status comes from the order itself.
orderSchema.virtual('paymentStatus').get(function paymentStatus() {
  if (this.paymentMethod === 'cod') return this.status === 'delivered' ? 'paid' : 'pending';
  if (!this.paymentIntent || typeof this.paymentIntent !== 'object') return undefined;
  return this.paymentIntent.status;
});

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
