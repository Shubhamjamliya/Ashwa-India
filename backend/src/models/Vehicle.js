const mongoose = require('mongoose');

// A vehicle belongs to one transporter. Its documents expire, and expiring ones raise alerts.
const vehicleSchema = new mongoose.Schema(
  {
    transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'Transporter', required: true, index: true },
    // The `key` of an admin-managed VehicleType.
    vehicleType: { type: String, required: true },
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
