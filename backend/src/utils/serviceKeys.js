const Service = require('../models/Service');

// Providers may only offer services from the active admin catalog.
async function validateServiceKeys(input) {
  if (!Array.isArray(input) || input.length === 0) return { error: 'Select at least one service' };
  const keys = [...new Set(input.map((k) => String(k).toLowerCase().trim()))];
  const found = await Service.countDocuments({ key: { $in: keys }, active: true });
  if (found !== keys.length) return { error: 'One or more selected services are not available' };
  return { keys };
}

module.exports = { validateServiceKeys };
