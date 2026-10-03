const mongoose = require('mongoose');

// Admin-managed catalog. Providers pick from these when they register and users book from them.
const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

serviceSchema.index({ active: 1, order: 1 });

module.exports = mongoose.model('Service', serviceSchema);
