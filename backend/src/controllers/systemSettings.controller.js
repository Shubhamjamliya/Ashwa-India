const SystemSettings = require('../models/SystemSettings');
const { uploadImageBuffer, removeUploadedFile } = require('../services/storage.service');
const { isCloudinaryConfigured } = require('../utils/cloudinary');
const asyncHandler = require('../utils/asyncHandler');

const LOGO_FIELDS = ['logo', 'userLogo', 'providerLogo', 'transporterLogo', 'favicon'];
const TEXT_FIELDS = ['companyName', 'email', 'phoneCountryCode', 'phoneNumber', 'address', 'state', 'pincode', 'region'];

async function getSingleton() {
  let settings = await SystemSettings.findOne({ key: 'singleton' });
  if (!settings) settings = await SystemSettings.create({ key: 'singleton' });
  return settings;
}

exports.getBusinessSetup = asyncHandler(async (req, res) => {
  const settings = await getSingleton();
  res.json({ businessSetup: settings.businessSetup });
});

exports.updateBusinessSetup = asyncHandler(async (req, res) => {
  const settings = await getSingleton();
  const current = settings.businessSetup.toObject();
  const next = { ...current };

  TEXT_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) next[field] = req.body[field];
  });

  for (const field of LOGO_FIELDS) {
    const file = req.files?.[field]?.[0];
    if (file) {
      await removeUploadedFile(current[field]);
      // Favicons keep a smaller square crop; everything else gets a generous max size.
      const dims = field === 'favicon' ? { width: 256, height: 256 } : { width: 1200, height: 1200 };
      next[field] = await uploadImageBuffer(file.buffer, dims);
    }
  }

  settings.businessSetup = next;
  await settings.save();
  res.json({ businessSetup: settings.businessSetup });
});

exports.getCustomization = asyncHandler(async (req, res) => {
  const settings = await getSingleton();
  res.json({ customization: settings.customization });
});

exports.updateCustomization = asyncHandler(async (req, res) => {
  const settings = await getSingleton();
  settings.customization = { ...settings.customization.toObject(), ...req.body };
  await settings.save();
  res.json({ customization: settings.customization });
});

// ---- Transport ----

exports.getTransportSettings = asyncHandler(async (req, res) => {
  const settings = await getSingleton();
  res.json({ transport: settings.transport });
});

// PUT { advanceType: 'fixed' | 'percent', advanceValue }
exports.updateTransportSettings = asyncHandler(async (req, res) => {
  const { advanceType, advanceValue } = req.body;
  if (!['fixed', 'percent'].includes(advanceType)) {
    return res.status(400).json({ message: 'advanceType must be "fixed" or "percent"' });
  }
  const value = Number(advanceValue);
  if (!Number.isFinite(value) || value < 0) return res.status(400).json({ message: 'Advance must be 0 or more' });
  if (advanceType === 'percent' && value > 100) return res.status(400).json({ message: 'Advance percent cannot be above 100' });

  const settings = await getSingleton();
  settings.transport = { advanceType, advanceValue: value };
  await settings.save();
  res.json({ transport: settings.transport });
});

// ---- Developer Settings ----

exports.getDeveloperSettings = asyncHandler(async (req, res) => {
  const settings = await getSingleton();
  res.json({
    developerSettings: settings.developerSettings,
    cloudinaryConfigured: isCloudinaryConfigured(),
  });
});

exports.updateDeveloperSettings = asyncHandler(async (req, res) => {
  const { imageUploadProvider } = req.body;
  if (!['local', 'cloudinary'].includes(imageUploadProvider)) {
    return res.status(400).json({ message: 'imageUploadProvider must be "local" or "cloudinary"' });
  }
  if (imageUploadProvider === 'cloudinary' && !isCloudinaryConfigured()) {
    return res.status(400).json({
      message: 'Cloudinary is not configured on the server (missing CLOUDINARY_* env vars)',
    });
  }

  const settings = await getSingleton();
  settings.developerSettings = { imageUploadProvider };
  await settings.save();
  res.json({ developerSettings: settings.developerSettings });
});
