const mongoose = require('mongoose');

// Balance here is a cache, derived only from PaymentTransaction rows — never
// written directly outside payment.service's wallet helpers (which update it
// in the same DB transaction as the ledger insert).
const paymentProviderWalletSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, unique: true },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentProviderWallet', paymentProviderWalletSchema);
