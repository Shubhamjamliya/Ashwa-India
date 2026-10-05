const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    number: { type: String, trim: true },
    expiresAt: { type: Date },
    uploadedAt: { type: Date },
  },
  { _id: false }
);

const transporterSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    businessName: { type: String, trim: true },
    companyType: { type: String, enum: ['individual', 'company'], default: 'individual' },
    vehicleTypes: [{ type: String }],
    serviceArea: { type: String },
    serviceType: { type: String, enum: ['private', 'shared', 'both'], default: 'private' },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended', 'archived'], default: 'pending' },
    isOnline: { type: Boolean, default: true },
    pricePerKm: { type: Number, default: 0, min: 0 },
    baseFare: { type: Number, default: 0, min: 0 },

    // Admin switches. A transporter only receives requests of a type that is enabled here.
    dedicatedEnabled: { type: Boolean, default: true },
    sharedEnabled: { type: Boolean, default: true },

    kyc: {
      status: { type: String, enum: ['not_submitted', 'submitted', 'verified', 'rejected'], default: 'not_submitted' },
      rejectionReason: { type: String, trim: true },
      identityProof: documentSchema,
      businessLicense: documentSchema,
      gst: {
        number: { type: String, trim: true },
        certificate: documentSchema,
      },
      bank: {
        accountName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        ifsc: { type: String, trim: true, uppercase: true },
        bankName: { type: String, trim: true },
      },
      submittedAt: { type: Date },
      verifiedAt: { type: Date },
    },

    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    fcmTokens: [{ type: String }],
  },
  { timestamps: true }
);

transporterSchema.methods.toSafeObject = function toSafeObject() {
  const {
    _id, name, phone, email, businessName, companyType, vehicleTypes, serviceArea, serviceType, location, status,
    isOnline, pricePerKm, baseFare, dedicatedEnabled, sharedEnabled, kyc, rating, createdAt,
  } = this;
  return {
    id: _id, name, phone, email, businessName, companyType, vehicleTypes, serviceArea, serviceType, location, status,
    isOnline, pricePerKm, baseFare, dedicatedEnabled, sharedEnabled, kyc, rating, createdAt, role: 'transporter',
  };
};

module.exports = mongoose.model('Transporter', transporterSchema);
