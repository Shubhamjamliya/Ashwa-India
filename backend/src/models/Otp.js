const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  otpExpiresAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true }, // TTL cleanup
  attempts: { type: Number, default: 0 },
  totalFailures: { type: Number, default: 0 },
  blockedUntil: { type: Date, default: null },
  requestCount: { type: Number, default: 1 },
  lastRequestAt: { type: Date, default: Date.now },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
