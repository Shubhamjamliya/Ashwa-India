const mongoose = require('mongoose');

// A buyer asks to see a horse in person at a preferred time. The seller accepts or declines.
const visitRequestSchema = new mongoose.Schema(
  {
    horse: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'HorseSeller', required: true },
    preferredAt: { type: Date, required: true },
    message: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled'], default: 'pending' },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VisitRequest', visitRequestSchema);
