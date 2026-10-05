const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    status: { type: String, enum: ['active', 'suspended', 'archived'], default: 'active' },
    fcmTokens: [{ type: String }],
    favouriteHorses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Horse' }],
    favouriteProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function toSafeObject() {
  const { _id, name, phone, email, status, createdAt } = this;
  return { id: _id, name, phone, email, status, createdAt, role: 'user' };
};

module.exports = mongoose.model('User', userSchema);
