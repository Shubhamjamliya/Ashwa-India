const Zone = require('../models/Zone');
const { PRICE_UNITS } = require('../models/Provider');
const { validateServiceKeys } = require('./serviceKeys');

const fail = (error) => ({ error });

// Validates the provider profile fields in `body` and returns the cleaned update.
// `current` holds the provider's existing services and prices, so prices stay tied to offered services.
async function buildProviderProfile(body, current = { serviceTypes: [], pricing: [] }) {
  const update = {};
  const { name, email, businessName, location, description, experienceYears, certifications, gallery, serviceTypes, pricing, serviceZones } = body;

  if (name !== undefined) update.name = String(name).trim();
  if (email !== undefined) update.email = String(email).trim();
  if (businessName !== undefined) update.businessName = String(businessName).trim();
  if (location !== undefined) update.location = String(location).trim();
  if (description !== undefined) update.description = String(description).trim();
  if (certifications !== undefined) update.certifications = String(certifications).trim();

  if (experienceYears !== undefined) {
    const years = Number(experienceYears);
    if (!(years >= 0)) return fail('Experience must be 0 or more years');
    update.experienceYears = years;
  }

  if (gallery !== undefined) {
    if (!Array.isArray(gallery) || gallery.some((g) => typeof g !== 'string')) return fail('Gallery must be a list of image links');
    update.gallery = gallery.slice(0, 20);
  }

  let offered = current.serviceTypes || [];
  if (serviceTypes !== undefined) {
    const check = await validateServiceKeys(serviceTypes);
    if (check.error) return fail(check.error);
    update.serviceTypes = check.keys;
    offered = check.keys;
  }

  if (pricing !== undefined) {
    if (!Array.isArray(pricing)) return fail('Pricing must be a list');
    const clean = [];
    for (const p of pricing) {
      const serviceKey = String(p.serviceKey || '').toLowerCase().trim();
      if (!offered.includes(serviceKey)) return fail('Set prices only for services you offer');
      const amount = Number(p.amount);
      if (!(amount >= 0)) return fail('Each price must be 0 or more');
      clean.push({
        serviceKey,
        amount,
        unit: PRICE_UNITS.includes(p.unit) ? p.unit : 'job',
        note: p.note ? String(p.note).trim() : '',
      });
    }
    update.pricing = clean;
  } else if (serviceTypes !== undefined) {
    // Dropping a service also drops its price.
    update.pricing = (current.pricing || []).filter((p) => offered.includes(p.serviceKey));
  }

  if (serviceZones !== undefined) {
    if (!Array.isArray(serviceZones)) return fail('Service area must be a list of zones');
    const ids = [...new Set(serviceZones.map(String))];
    const found = await Zone.countDocuments({ _id: { $in: ids }, isActive: true });
    if (found !== ids.length) return fail('One or more selected service areas are not available');
    update.serviceZones = ids;
  }

  return { update };
}

module.exports = { buildProviderProfile };
