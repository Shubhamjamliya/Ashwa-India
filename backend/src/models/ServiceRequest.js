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
    respondedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ provider: 1, status: 1, createdAt: -1 });
serviceRequestSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
