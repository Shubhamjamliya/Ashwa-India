const mongoose = require('mongoose');

const storeSellerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    businessName: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended', 'archived'], default: 'pending' },
  },
  { timestamps: true }
);

storeSellerSchema.methods.toSafeObject = function toSafeObject() {
  const { _id, name, phone, email, businessName, status, createdAt } = this;
  return { id: _id, name, phone, email, businessName, status, createdAt, role: 'store-seller' };
};

module.exports = mongoose.model('StoreSeller', storeSellerSchema);
