const mongoose = require('mongoose');

// Jobs a user or provider has bookmarked.
const savedJobSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    accountModel: { type: String, enum: ['User', 'Provider'], required: true },
    account: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'accountModel' },
  },
  { timestamps: true }
);

savedJobSchema.index({ job: 1, account: 1 }, { unique: true });

module.exports = mongoose.model('SavedJob', savedJobSchema);
