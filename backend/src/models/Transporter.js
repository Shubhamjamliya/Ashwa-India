const mongoose = require('mongoose');

const transporterSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    businessName: { type: String, trim: true },
    vehicleTypes: [{ type: String }],
    serviceArea: { type: String },
    serviceType: { type: String, enum: ['private', 'shared', 'both'], default: 'private' },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended', 'archived'], default: 'pending' },
  },
  { timestamps: true }
);

transporterSchema.methods.toSafeObject = function toSafeObject() {
  const { _id, name, phone, email, businessName, vehicleTypes, serviceArea, serviceType, location, status, createdAt } = this;
  return { id: _id, name, phone, email, businessName, vehicleTypes, serviceArea, serviceType, location, status, createdAt, role: 'transporter' };
};

module.exports = mongoose.model('Transporter', transporterSchema);
