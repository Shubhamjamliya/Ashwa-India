const mongoose = require('mongoose');

const horseCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. breed group or purpose: Racing, Breeding, Riding
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: { type: String, trim: true }, // free-form grouping label, e.g. "Breed", "Purpose"
    description: { type: String },
    image: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },

    // Seller-proposed categories go through admin approval, same as admin-created
    // ones start out already approved + global.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'HorseSeller', default: null }, // null = created by admin
    isGlobal: { type: Boolean, default: true }, // available to every seller once approved
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HorseCategory', horseCategorySchema);
