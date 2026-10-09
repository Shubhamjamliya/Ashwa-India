const VehicleType = require('../models/VehicleType');

const round1 = (n) => Math.round(n * 10) / 10;

// The admin's fare for one vehicle type over `km`: max(minFare, baseFare + km × pricePerKm).
function quoteFor(pricing, km) {
  const raw = (pricing.baseFare || 0) + km * (pricing.pricePerKm || 0);
  return {
    tripKm: round1(km),
    pricePerKm: pricing.pricePerKm || 0,
    baseFare: pricing.baseFare || 0,
    amount: Math.round(Math.max(pricing.minFare || 0, raw)),
  };
}

// Bookable types: active and priced by the admin.
async function bookableTypes() {
  return VehicleType.find({ active: true, pricePerKm: { $gt: 0 } }).sort({ order: 1, name: 1 });
}

async function bookableType(key) {
  if (!key) return null;
  return VehicleType.findOne({ key, active: true, pricePerKm: { $gt: 0 } });
}

module.exports = { quoteFor, bookableTypes, bookableType };
