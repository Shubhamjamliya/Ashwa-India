const Provider = require('../models/Provider');
const ServiceReview = require('../models/ServiceReview');
const asyncHandler = require('../utils/asyncHandler');
const { buildProviderProfile } = require('../utils/providerProfile');

exports.list = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const providers = await Provider.find(filter).sort({ createdAt: -1 });
  res.json({ providers });
});

// Full profile for the admin review dialog: zone names instead of ids, plus recent reviews.
exports.getById = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id).populate('serviceZones', 'name serviceLocation isActive');
  if (!provider) return res.status(404).json({ message: 'Provider not found' });

  const reviews = await ServiceReview.find({ provider: provider._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate('user', 'name');

  res.json({
    provider,
    reviews: reviews.map((r) => ({
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      userName: r.user?.name || 'User',
      createdAt: r.createdAt,
    })),
  });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected', 'suspended', 'archived'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const provider = await Provider.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!provider) return res.status(404).json({ message: 'Provider not found' });
  res.json({ provider });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.user._id);
  if (!provider) return res.status(404).json({ message: 'Provider not found' });

  const built = await buildProviderProfile(req.body, {
    serviceTypes: provider.serviceTypes,
    pricing: provider.pricing,
  });
  if (built.error) return res.status(400).json({ message: built.error });

  const updated = await Provider.findByIdAndUpdate(req.user._id, built.update, { new: true });
  res.json({ provider: updated });
});

exports.updateAvailability = asyncHandler(async (req, res) => {
  const { isOnline, coords } = req.body;
  if (typeof isOnline !== 'boolean') return res.status(400).json({ message: 'isOnline must be a boolean' });

  const update = { isOnline };
  if (coords) {
    if (typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      return res.status(400).json({ message: 'coords needs numeric lat and lng' });
    }
    update.coords = { lat: coords.lat, lng: coords.lng };
  }

  const provider = await Provider.findByIdAndUpdate(req.user._id, update, { new: true });
  res.json({ provider });
});
