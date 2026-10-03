const mongoose = require('mongoose');

// One rule per partner type. Applied to each completed booking at settlement time.
// Bookings store the rule they were settled with, so later edits never change history.
const commissionRuleSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['transporter', 'provider'], required: true, unique: true },
    percent: { type: Number, default: 10, min: 0, max: 100 },
    fixedPerBooking: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommissionRule', commissionRuleSchema);
