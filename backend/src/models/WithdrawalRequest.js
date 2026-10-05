const mongoose = require('mongoose');

// A transporter asks to move wallet money out. Approving debits the wallet; paying marks it done.
const withdrawalSchema = new mongoose.Schema(
  {
    transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'Transporter', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['requested', 'approved', 'rejected', 'paid'], default: 'requested' },
    bankSnapshot: { accountName: String, accountNumber: String, ifsc: String, bankName: String },
    note: { type: String, trim: true },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WithdrawalRequest', withdrawalSchema);
