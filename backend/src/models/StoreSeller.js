const mongoose = require('mongoose');

const storeSellerSchema = new mongoose.Schema(
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

storeSellerSchema.methods.toSafeObject = function toSafeObject() {
  const { _id, name, phone, email, businessName, logo, status, createdAt } = this;
  return { id: _id, name, phone, email, businessName, logo, status, createdAt, role: 'store-seller' };
};

module.exports = mongoose.model('StoreSeller', storeSellerSchema);
