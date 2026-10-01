const SystemSettings = require('../models/SystemSettings');
const asyncHandler = require('../utils/asyncHandler');

// Public, unauthenticated subset of business setup — safe to expose on login
// pages and for the browser tab favicon/title, before anyone is logged in.
exports.getPublicBranding = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.findOne({ key: 'singleton' });
  const b = settings?.businessSetup || {};
  res.json({
    companyName: b.companyName || 'Ashwa India',
    logo: b.logo || null,
    favicon: b.favicon || null,
    userLogo: b.userLogo || null,
    providerLogo: b.providerLogo || null,
    transporterLogo: b.transporterLogo || null,
  });
});
