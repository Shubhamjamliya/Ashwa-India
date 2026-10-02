const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true },
    // Optional display label (city/area) shown in the admin list — can mirror name.
    serviceLocation: { type: String, trim: true },
    unit: { type: String, enum: ['kilometer', 'miles'], default: 'kilometer' },
    color: { type: String, default: '#C28D2E' },
    isActive: { type: Boolean, default: true },
    // GeoJSON Polygon: coordinates is an array of linear rings, each ring an
    // array of [lng, lat] pairs, first ring is the outer boundary, first and
    // last point of each ring must match (closed loop).
    polygon: {
      type: { type: String, enum: ['Polygon'], default: 'Polygon' },
      coordinates: { type: [[[Number]]], required: true },
    },
  },
  { timestamps: true }
);

zoneSchema.index({ polygon: '2dsphere' });

module.exports = mongoose.model('Zone', zoneSchema);
