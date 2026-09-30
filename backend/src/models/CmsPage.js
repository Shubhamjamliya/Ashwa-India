const mongoose = require('mongoose');

const cmsPageSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ['about', 'contact', 'terms', 'privacy', 'support', 'refund', 'shipping', 'cancellation'],
    },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    // About Us page only
    appName: { type: String },
    version: { type: String },
    description: { type: String },
    features: [
      {
        icon: String,
        title: String,
        description: String,
      },
    ],
    // Contact page only
    email: { type: String },
    mobile: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CmsPage', cmsPageSchema);
