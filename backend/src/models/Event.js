const mongoose = require('mongoose');

const EVENT_TYPES = ['horse-show', 'auction', 'competition', 'training-camp', 'exhibition', 'other'];

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    eventType: { type: String, enum: EVENT_TYPES, default: 'horse-show' },
    description: { type: String, trim: true },
    location: { type: String, trim: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    image: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

eventSchema.index({ active: 1, startsAt: -1 });

module.exports = mongoose.model('Event', eventSchema);
module.exports.EVENT_TYPES = EVENT_TYPES;
