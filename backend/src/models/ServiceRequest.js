const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
    serviceType: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    // Set by the provider when accepting; the price the booking is settled on.
    amount: { type: Number, min: 0 },
    respondedAt: { type: Date },
    completedAt: { type: Date },
    paymentStatus: { type: String, enum: ['unpaid', 'settled'], default: 'unpaid' },
    settlement: {
      type: new mongoose.Schema(
        {
          grossAmount: { type: Number, required: true },
          commissionPercent: { type: Number, required: true },
          commissionFixed: { type: Number, required: true },
          commission: { type: Number, required: true },
          netAmount: { type: Number, required: true },
          settledAt: { type: Date, required: true },
        },
        { _id: false }
      ),
    },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ provider: 1, status: 1, createdAt: -1 });
serviceRequestSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
