const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'singleton', unique: true },
    businessSetup: {
      companyName: { type: String, default: 'Ashwa India' },
      email: { type: String, default: '' },
      phoneCountryCode: { type: String, default: '+91' },
      phoneNumber: { type: String, default: '' },
      address: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      region: { type: String, default: 'India' },
      logo: { url: String, filename: String, publicId: String, provider: String }, // main website logo
      userLogo: { url: String, filename: String, publicId: String, provider: String }, // UserApp
      providerLogo: { url: String, filename: String, publicId: String, provider: String }, // ProviderApp
      transporterLogo: { url: String, filename: String, publicId: String, provider: String }, // TransporterApp
      favicon: { url: String, filename: String, publicId: String, provider: String },
    },
    customization: {
      horseMarketplace: { type: Boolean, default: true },
      accessoriesStore: { type: Boolean, default: true },
      transportSharing: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true },
      newRegistrations: { type: Boolean, default: true },
      maintenanceMode: { type: Boolean, default: false },
    },
    developerSettings: {
      imageUploadProvider: { type: String, enum: ['local', 'cloudinary'], default: 'local' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
