const mongoose = require('mongoose');

// The four tiles on the user app's "Explore Ashwa India" row. One document per tile.
const exploreItemSchema = new mongoose.Schema(
  {
    key: { type: String, enum: ['horses', 'providers', 'transport', 'store', 'events', 'jobs'], required: true, unique: true },
    label: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExploreItem', exploreItemSchema);
