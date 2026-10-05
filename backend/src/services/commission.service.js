const CommissionRule = require('../models/CommissionRule');
const paymentService = require('./payment.service');

const ROLES = ['transporter', 'provider', 'store-seller'];

async function getRule(role) {
  return CommissionRule.findOneAndUpdate({ role }, { $setOnInsert: { role } }, { upsert: true, new: true });
}

async function getAllRules() {
  return Promise.all(ROLES.map(getRule));
}

// Commission is capped at the gross amount so a fixed fee can never make the partner pay the platform.
function calculate(amount, rule) {
  if (!rule.active) return { commissionPercent: 0, commissionFixed: 0, commission: 0, netAmount: amount };
  const commission = Math.min(amount, Math.round((amount * rule.percent) / 100 + rule.fixedPerBooking));
  return {
    commissionPercent: rule.percent,
    commissionFixed: rule.fixedPerBooking,
    commission,
    netAmount: amount - commission,
  };
}

// Credits the partner's wallet with the net amount and returns the settlement snapshot to store on the booking.
async function settle({ role, ownerId, amount, description }) {
  const rule = await getRule(role);
  const figures = calculate(amount, rule);
  if (figures.netAmount > 0) {
    await paymentService.payout(role, ownerId, figures.netAmount, { description });
  }
  return { grossAmount: amount, ...figures, settledAt: new Date() };
}

module.exports = { ROLES, getRule, getAllRules, calculate, settle };
