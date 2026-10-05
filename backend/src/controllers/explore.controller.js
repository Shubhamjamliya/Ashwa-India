const ExploreItem = require('../models/ExploreItem');
const asyncHandler = require('../utils/asyncHandler');

const DEFAULTS = [
  { key: 'horses', label: 'Horse Marketplace', order: 0 },
  { key: 'providers', label: 'Service Providers', order: 1 },
  { key: 'transport', label: 'Horse Transport', order: 2 },
  { key: 'store', label: 'Accessories Store', order: 3 },
  { key: 'events', label: 'Events', order: 4 },
  { key: 'jobs', label: 'Horse Jobs', order: 5 },
];

const KEYS = DEFAULTS.map((d) => d.key);

async function ensureDefaults() {
  await Promise.all(
    DEFAULTS.map((d) => ExploreItem.updateOne({ key: d.key }, { $setOnInsert: d }, { upsert: true }))
  );
}

// GET /api/explore — public, active tiles in display order
exports.listActive = asyncHandler(async (req, res) => {
  await ensureDefaults();
  const items = await ExploreItem.find({ active: true }).sort({ order: 1 });
  res.json({ items });
});

// GET /api/explore/admin — admin, all four tiles
exports.listAll = asyncHandler(async (req, res) => {
  await ensureDefaults();
  const items = await ExploreItem.find().sort({ order: 1 });
  res.json({ items });
});

// PUT /api/explore/:key — admin { label, image, active }
exports.update = asyncHandler(async (req, res) => {
  const { key } = req.params;
  if (!KEYS.includes(key)) return res.status(400).json({ message: 'Unknown explore tile' });

  const { label, image, active } = req.body;
  const update = {};
  if (label !== undefined) {
    if (!String(label).trim()) return res.status(400).json({ message: 'Label cannot be empty' });
    update.label = String(label).trim();
  }
  if (image !== undefined) update.image = String(image);
  if (active !== undefined) {
    if (typeof active !== 'boolean') return res.status(400).json({ message: 'active must be true or false' });
    update.active = active;
  }

  await ensureDefaults();
  const item = await ExploreItem.findOneAndUpdate({ key }, update, { new: true });
  res.json({ item });
});
