const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    businessName: { type: String, trim: true },
    serviceTypes: [{ type: String }], // vet, trainer, farrier, groomer, boarding, instructor...
    location: { type: String },
    coords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    isOnline: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended', 'archived'], default: 'pending' },
    fcmTokens: [{ type: String }],
  },
  { timestamps: true }
);

providerSchema.methods.toSafeObject = function toSafeObject() {
  const { _id, name, phone, email, businessName, serviceTypes, location, coords, isOnline, status, createdAt } = this;
  return { id: _id, name, phone, email, businessName, serviceTypes, location, coords, isOnline, status, createdAt, role: 'provider' };
};

module.exports = mongoose.model('Provider', providerSchema);
