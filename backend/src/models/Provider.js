const mongoose = require('mongoose');

const PRICE_UNITS = ['visit', 'hour', 'day', 'job'];

const priceSchema = new mongoose.Schema(
  {
    serviceKey: { type: String, required: true, lowercase: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: PRICE_UNITS, default: 'job' },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },

    // Registration form details
    whatsapp: { type: String, trim: true },
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    profileTypes: [{ type: String, trim: true }],
    horseCount: { type: String, trim: true },
    horseBreeds: [{ type: String, trim: true }],
    additionalInfo: { type: String, trim: true },
    declarationAccepted: { type: Boolean, default: false },

    // Business profile
    businessName: { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    experienceYears: { type: Number, min: 0, default: 0 },
    certifications: { type: String, trim: true, default: '' },
    gallery: [{ type: String }],

    // What they offer. serviceTypes are keys from the admin service catalog.
    serviceTypes: [{ type: String }],
    pricing: [priceSchema],

    // Service area is chosen from admin-managed zones only.
    serviceZones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Zone' }],

    // Contact / base location (free text address shown to users).
    location: { type: String },
    coords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    isOnline: { type: Boolean, default: true },

    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended', 'archived'], default: 'pending' },
    fcmTokens: [{ type: String }],
  },
  { timestamps: true }
);

providerSchema.methods.toSafeObject = function toSafeObject() {
  const {
    _id, name, phone, email, businessName, description, experienceYears, certifications, gallery,
    serviceTypes, pricing, serviceZones, location, coords, isOnline, rating, status, createdAt,
    whatsapp, country, state, city, profileTypes, horseCount, horseBreeds, additionalInfo,
  } = this;
  return {
    id: _id, name, phone, email, businessName, description, experienceYears, certifications, gallery,
    serviceTypes, pricing, serviceZones, location, coords, isOnline, rating, status, createdAt, role: 'provider',
    whatsapp, country, state, city, profileTypes, horseCount, horseBreeds, additionalInfo,
  };
};

module.exports = mongoose.model('Provider', providerSchema);
module.exports.PRICE_UNITS = PRICE_UNITS;
