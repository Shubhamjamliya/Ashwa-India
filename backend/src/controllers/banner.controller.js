const Banner = require('../models/Banner');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/banners — public, active only, for the user app's hero carousel
exports.listActive = asyncHandler(async (req, res) => {
  const banners = await Banner.find({ status: 'active' }).sort({ order: 1, createdAt: -1 });
  res.json({ banners });
});

// GET /api/banners/admin — admin-only, everything
exports.listAll = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
  res.json({ banners });
});

exports.create = asyncHandler(async (req, res) => {
  const { image, title, subtitle, link, order, status } = req.body;
  if (!image) return res.status(400).json({ message: 'image is required' });

  const banner = await Banner.create({ image, title, subtitle, link, order, status });
  res.status(201).json({ banner });
});

exports.update = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return res.status(404).json({ message: 'Banner not found' });

  const { image, title, subtitle, link, order, status } = req.body;
  if (image !== undefined) banner.image = image;
  if (title !== undefined) banner.title = title;
  if (subtitle !== undefined) banner.subtitle = subtitle;
  if (link !== undefined) banner.link = link;
  if (order !== undefined) banner.order = order;
  if (status !== undefined) banner.status = status;

  await banner.save();
  res.json({ banner });
});

exports.remove = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return res.status(404).json({ message: 'Banner not found' });
  await banner.deleteOne();
  res.json({ message: 'Banner removed' });
});
