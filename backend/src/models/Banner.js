const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    title: { type: String },
    subtitle: { type: String },
    link: { type: String }, // optional deep-link target, e.g. "horse-marketplace", "store", or an external URL
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
