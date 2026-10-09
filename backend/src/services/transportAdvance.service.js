const SystemSettings = require('../models/SystemSettings');
const TransportRequest = require('../models/TransportRequest');
const paymentService = require('./payment.service');

async function getConfig() {
  const settings = await SystemSettings.findOne({ key: 'singleton' }).select('transport');
  return { advanceType: settings?.transport?.advanceType || 'percent', advanceValue: settings?.transport?.advanceValue || 0 };
}

// The advance for a booking of `amount`, as the admin configured it. Never more than the booking itself.
async function advanceFor(amount) {
  const { advanceType, advanceValue } = await getConfig();
  const raw = advanceType === 'fixed' ? advanceValue : (amount * advanceValue) / 100;
  return Math.max(0, Math.min(Math.round(amount), Math.round(raw)));
}

// Returns a paid advance to the user's wallet. Safe to call more than once.
async function refund(request, description) {
  if (request.advance?.status !== 'paid' || !(request.advance.amount > 0)) return;
  // Claim the refund atomically so two concurrent calls can never both credit the wallet.
  const refundedAt = new Date();
  const claimed = await TransportRequest.findOneAndUpdate(
    { _id: request._id, 'advance.status': 'paid' },
    { 'advance.status': 'refunded', 'advance.refundedAt': refundedAt }
  );
  if (!claimed) return;
  request.advance.status = 'refunded';
  request.advance.refundedAt = refundedAt;
  await paymentService.creditWallet('user', request.user._id || request.user, request.advance.amount, {
    paymentIntentId: request.advance.paymentIntent,
    description: description || `Advance refund for transport booking ${request._id}`,
  });
}

module.exports = { getConfig, advanceFor, refund };
