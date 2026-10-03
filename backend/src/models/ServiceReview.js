const mongoose = require('mongoose');

// One review per completed service request. Ratings roll up into the provider's rating.
const serviceReviewSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true, unique: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

serviceReviewSchema.index({ provider: 1, createdAt: -1 });

module.exports = mongoose.model('ServiceReview', serviceReviewSchema);
