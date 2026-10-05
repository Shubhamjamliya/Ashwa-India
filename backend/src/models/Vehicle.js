const mongoose = require('mongoose');

const VEHICLE_TYPES = ['horse-trailer', 'horse-van', 'covered-truck', 'open-truck', 'mini-truck', 'other'];

// A vehicle belongs to one transporter. Its documents expire, and expiring ones raise alerts.
const vehicleSchema = new mongoose.Schema(
  {
    transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'Transporter', required: true, index: true },
    vehicleType: { type: String, enum: VEHICLE_TYPES, required: true },
    registrationNumber: { type: String, required: true, trim: true, uppercase: true },
    capacityKg: { type: Number, min: 0 },
    compartments: { type: Number, min: 0, default: 1 },
    maxAnimals: { type: Number, min: 0, default: 1 },
    images: [{ type: String }],
    documents: {
      registrationCertificate: { url: String, expiresAt: Date },
      insurance: { url: String, expiresAt: Date },
      fitness: { url: String, expiresAt: Date },
    },
    dedicated: { type: Boolean, default: true },
    shared: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

vehicleSchema.index({ transporter: 1, registrationNumber: 1 }, { unique: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
module.exports.VEHICLE_TYPES = VEHICLE_TYPES;
