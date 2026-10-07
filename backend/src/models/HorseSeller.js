const mongoose = require('mongoose');

const horseSellerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    businessName: { type: String, trim: true },
    logo: { url: String, filename: String, publicId: String, provider: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended', 'archived'], default: 'pending' },
    fcmTokens: [{ type: String }],
  },
  { timestamps: true }
);

horseSellerSchema.methods.toSafeObject = function toSafeObject() {
  const { _id, name, phone, email, businessName, logo, status, createdAt } = this;
  return { id: _id, _id, name, phone, email, businessName, logo, status, createdAt, role: 'horse-seller' };
};

module.exports = mongoose.model('HorseSeller', horseSellerSchema);
