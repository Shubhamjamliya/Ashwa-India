const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    profileImage: { type: String },
    password: { type: String, required: true, minlength: 6, select: false },
    accessLevel: { type: String, default: 'Full Access' }, // "Full Access" = main admin, else a scoped sub-admin label
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { timestamps: true }
);

adminSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

adminSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

adminSchema.methods.toSafeObject = function toSafeObject() {
  const { _id, name, email, phone, profileImage, accessLevel, status, createdAt } = this;
  return { id: _id, name, email, phone, profileImage, accessLevel, status, createdAt, role: 'admin' };
};

module.exports = mongoose.model('Admin', adminSchema);
