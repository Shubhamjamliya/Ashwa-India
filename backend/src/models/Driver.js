const mongoose = require('mongoose');

// A driver works for one transporter and can be assigned to that transporter's trips.
const driverSchema = new mongoose.Schema(
  {
    transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'Transporter', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, trim: true },
    licenseExpiresAt: { type: Date },
    licenseImage: { type: String },
    idProofImage: { type: String },
    isAvailable: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Driver', driverSchema);
