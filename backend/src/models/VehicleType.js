const mongoose = require('mongoose');

// Transport vehicle categories the admin manages (e.g. Bolero, Truck, Premium Horse Ambulance).
// The admin also sets each type's price, so every transporter with that type charges the same.
// Vehicles store the `key`, so renaming a type or changing its icon never touches existing vehicles.
const vehicleTypeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    icon: { type: String, default: '' },
    // Fare = max(minFare, baseFare + km × pricePerKm). A type with no per-km price is not bookable.
    baseFare: { type: Number, default: 0, min: 0 },
    pricePerKm: { type: Number, default: 0, min: 0 },
    minFare: { type: Number, default: 0, min: 0 },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VehicleType', vehicleTypeSchema);
