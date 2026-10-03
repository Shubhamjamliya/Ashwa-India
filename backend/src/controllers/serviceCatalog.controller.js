const Service = require('../models/Service');
const asyncHandler = require('../utils/asyncHandler');

const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// GET /api/service-catalog — public, active services in display order
exports.listActive = asyncHandler(async (req, res) => {
  const services = await Service.find({ active: true }).sort({ order: 1, name: 1 });
  res.json({ services });
});

// GET /api/service-catalog/admin
exports.listAll = asyncHandler(async (req, res) => {
  const services = await Service.find().sort({ order: 1, name: 1 });
  res.json({ services });
});

// POST /api/service-catalog (admin) { name, description, image, order, active }
exports.create = asyncHandler(async (req, res) => {
  const { name, description, image, order, active } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ message: 'Name is required' });

  const key = slugify(name);
  if (!key) return res.status(400).json({ message: 'Name must contain letters or numbers' });
  if (await Service.exists({ key })) return res.status(409).json({ message: 'A service with this name already exists' });

  const service = await Service.create({
    name: String(name).trim(),
    key,
    description: description ? String(description).trim() : '',
    image: image || '',
    order: Number.isFinite(Number(order)) ? Number(order) : 0,
    active: active !== false,
  });
  res.status(201).json({ service });
});

// PUT /api/service-catalog/:id (admin). The key never changes, so existing provider selections stay valid.
exports.update = asyncHandler(async (req, res) => {
  const { name, description, image, order, active } = req.body;
  const update = {};
  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ message: 'Name is required' });
    update.name = String(name).trim();
  }
  if (description !== undefined) update.description = String(description).trim();
  if (image !== undefined) update.image = String(image);
  if (order !== undefined && Number.isFinite(Number(order))) update.order = Number(order);
  if (active !== undefined) {
    if (typeof active !== 'boolean') return res.status(400).json({ message: 'active must be true or false' });
    update.active = active;
  }

  const service = await Service.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json({ service });
});

// DELETE /api/service-catalog/:id (admin)
exports.remove = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json({ ok: true });
});
