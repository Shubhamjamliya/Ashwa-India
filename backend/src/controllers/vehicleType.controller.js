const VehicleType = require('../models/VehicleType');
const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../utils/asyncHandler');
const { isUploadedUrl: isUrl } = require('../utils/isUploadedUrl');

// The types vehicles used before admins could manage them. Seeded once so existing vehicles keep a label.
const DEFAULT_TYPES = [
  { key: 'horse-trailer', name: 'Horse trailer' },
  { key: 'horse-van', name: 'Horse van' },
  { key: 'covered-truck', name: 'Covered truck' },
  { key: 'open-truck', name: 'Open truck' },
  { key: 'mini-truck', name: 'Mini truck' },
  { key: 'other', name: 'Other' },
];
const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const PRICE_FIELDS = ['baseFare', 'pricePerKm', 'minFare'];

// Reads the admin's price fields. Returns { prices } or { error }.
function readPrices(body) {
  const prices = {};
  for (const f of PRICE_FIELDS) {
    if (body[f] === undefined || body[f] === '') continue;
    const n = Number(body[f]);
    if (!Number.isFinite(n) || n < 0) return { error: 'Prices must be 0 or more' };
    prices[f] = Math.round(n * 100) / 100;
  }
  return { prices };
}

async function ensureSeeded() {
  if (await VehicleType.exists({})) return;
  await VehicleType.insertMany(DEFAULT_TYPES.map((t, i) => ({ ...t, order: i })));
}

async function listTypes(filter = {}) {
  await ensureSeeded();
  return VehicleType.find(filter).sort({ order: 1, name: 1 });
}

// GET /api/vehicle-types — active types, for transporters picking a type and users seeing icons
exports.listActive = asyncHandler(async (req, res) => {
  res.json({ vehicleTypes: await listTypes({ active: true }) });
});

// GET /api/vehicle-types/admin  (admin) — every type, with how many vehicles use it
exports.listAll = asyncHandler(async (req, res) => {
  const types = await listTypes();
  const counts = await Vehicle.aggregate([{ $match: { active: true } }, { $group: { _id: '$vehicleType', count: { $sum: 1 } } }]);
  const byKey = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  res.json({ vehicleTypes: types.map((t) => ({ ...t.toObject(), vehicles: byKey[t.key] || 0 })) });
});

// POST /api/vehicle-types  (admin) { name, description, icon, baseFare, pricePerKm, minFare, order, active }
exports.create = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Name is required' });
  if (req.body.icon && !isUrl(req.body.icon)) return res.status(400).json({ message: 'Upload an icon image' });
  const key = slugify(name);
  if (!key) return res.status(400).json({ message: 'Use letters or numbers in the name' });
  if (await VehicleType.exists({ key })) return res.status(409).json({ message: 'A vehicle type with this name already exists' });
  const { prices, error } = readPrices(req.body);
  if (error) return res.status(400).json({ message: error });

  const vehicleType = await VehicleType.create({
    key,
    name,
    description: String(req.body.description || '').trim(),
    icon: req.body.icon || '',
    ...prices,
    order: Number(req.body.order) || 0,
    active: req.body.active !== false,
  });
  res.status(201).json({ vehicleType });
});

// PUT /api/vehicle-types/:id  (admin) — the key never changes, so vehicles keep pointing at this type
exports.update = asyncHandler(async (req, res) => {
  const vehicleType = await VehicleType.findById(req.params.id);
  if (!vehicleType) return res.status(404).json({ message: 'Vehicle type not found' });
  const { name, description, icon, order, active } = req.body;
  const { prices, error } = readPrices(req.body);
  if (error) return res.status(400).json({ message: error });
  Object.assign(vehicleType, prices);
  if (description !== undefined) vehicleType.description = String(description).trim();
  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ message: 'Name is required' });
    vehicleType.name = String(name).trim();
  }
  if (icon !== undefined) {
    if (icon && !isUrl(icon)) return res.status(400).json({ message: 'Upload an icon image' });
    vehicleType.icon = icon || '';
  }
  if (order !== undefined) vehicleType.order = Number(order) || 0;
  if (active !== undefined) vehicleType.active = Boolean(active);
  await vehicleType.save();
  res.json({ vehicleType });
});

// DELETE /api/vehicle-types/:id  (admin) — blocked while vehicles still use it; deactivate it instead
exports.remove = asyncHandler(async (req, res) => {
  const vehicleType = await VehicleType.findById(req.params.id);
  if (!vehicleType) return res.status(404).json({ message: 'Vehicle type not found' });
  const inUse = await Vehicle.countDocuments({ vehicleType: vehicleType.key, active: true });
  if (inUse) {
    return res.status(400).json({ message: `${inUse} vehicle(s) use this type. Turn it off instead of deleting it.` });
  }
  await vehicleType.deleteOne();
  res.json({ ok: true });
});

exports.listTypes = listTypes;
