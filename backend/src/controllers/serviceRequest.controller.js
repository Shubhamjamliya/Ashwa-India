const Provider = require('../models/Provider');
const ServiceReview = require('../models/ServiceReview');
const Zone = require('../models/Zone');
const ServiceRequest = require('../models/ServiceRequest');
const asyncHandler = require('../utils/asyncHandler');
const pushService = require('../services/push.service');
const commissionService = require('../services/commission.service');
const { zonesContaining } = require('./zone.controller');

const USER_FIELDS = 'name phone';
const PROVIDER_FIELDS = 'name businessName phone serviceTypes location';

async function populateRequest(request) {
  return request.populate([
    { path: 'user', select: USER_FIELDS },
    { path: 'provider', select: PROVIDER_FIELDS },
  ]);
}

function emitToRequestParties(req, request, event) {
  const io = req.app.get('io');
  if (!io) return;
  io.to(`user:${request.user._id || request.user}`).emit(event, request);
  io.to(`provider:${request.provider._id || request.provider}`).emit(event, request);
}

// POST /api/services/requests  (user)
exports.createRequest = asyncHandler(async (req, res) => {
  const { providerId, serviceType, message } = req.body;
  if (!providerId || !serviceType) {
    return res.status(400).json({ message: 'providerId and serviceType are required' });
  }

  const provider = await Provider.findById(providerId);
  if (!provider || provider.status !== 'approved') {
    return res.status(404).json({ message: 'Provider not found' });
  }
  if (provider.isOnline === false) {
    return res.status(400).json({ message: 'This provider is currently offline' });
  }
  const offered = provider.serviceTypes.some((s) => s.toLowerCase() === String(serviceType).toLowerCase());
  if (!offered) {
    return res.status(400).json({ message: 'This provider does not offer that service' });
  }

  const request = await ServiceRequest.create({
    user: req.user._id,
    provider: provider._id,
    serviceType,
    message,
  });
  const populated = await populateRequest(request);

  const io = req.app.get('io');
  if (io) io.to(`provider:${provider._id}`).emit('service:new', populated);
  pushService
    .sendPushToAccount('provider', provider._id, {
      title: 'New service request',
      body: `${populated.user?.name || 'A user'} requested ${serviceType}`,
      data: { type: 'service:new', requestId: String(request._id) },
    })
    .catch(() => {});

  res.status(201).json({ request: populated });
});

// GET /api/services/requests/mine  (user)
exports.listMine = asyncHandler(async (req, res) => {
  const requests = await ServiceRequest.find({ user: req.user._id })
    .populate('provider', PROVIDER_FIELDS)
    .sort({ createdAt: -1 });
  res.json({ requests });
});

// GET /api/services/requests/incoming  (provider)
exports.listIncoming = asyncHandler(async (req, res) => {
  const requests = await ServiceRequest.find({ provider: req.user._id })
    .populate('user', USER_FIELDS)
    .sort({ createdAt: -1 });
  res.json({ requests });
});

// PATCH /api/services/requests/:id/respond  (provider)
// { action: 'accept', amount } | { action: 'reject' } | { action: 'complete' }
exports.respond = asyncHandler(async (req, res) => {
  const { action, amount } = req.body;
  if (!['accept', 'reject', 'complete'].includes(action)) {
    return res.status(400).json({ message: 'action must be accept, reject or complete' });
  }

  const request = await ServiceRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (String(request.provider) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your request' });
  }

  if (action === 'complete') {
    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted requests can be completed' });
    }
    if (!(request.amount > 0)) {
      return res.status(400).json({ message: 'This booking has no price to settle' });
    }
    request.settlement = await commissionService.settle({
      role: 'provider',
      ownerId: req.user._id,
      amount: request.amount,
      description: `Service booking ${request._id} completed`,
    });
    request.status = 'completed';
    request.completedAt = new Date();
    request.paymentStatus = 'settled';
  } else {
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already responded to' });
    }
    if (action === 'accept') {
      const price = Number(amount);
      if (!(price > 0)) {
        return res.status(400).json({ message: 'Enter the price for this service before accepting' });
      }
      request.amount = price;
      request.status = 'accepted';
    } else {
      request.status = 'rejected';
    }
    request.respondedAt = new Date();
  }
  await request.save();

  const populated = await populateRequest(request);
  emitToRequestParties(req, populated, 'service:update');

  pushService
    .sendPushToAccount('user', request.user, {
      title: `Service request ${request.status}`,
      body: `${populated.provider?.businessName || populated.provider?.name || 'The provider'} marked your ${request.serviceType} request as ${request.status}`,
      data: { type: 'service:update', requestId: String(request._id) },
    })
    .catch(() => {});

  res.json({ request: populated });
});

const EARTH_RADIUS_KM = 6371;
function distanceKm(a, b) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// Public-facing provider card fields. Contact details are shared only once a request is accepted.
function publicProvider(p, serviceKey) {
  return {
    id: p._id,
    businessName: p.businessName || p.name,
    description: p.description || '',
    experienceYears: p.experienceYears || 0,
    gallery: (p.gallery || []).slice(0, 6),
    serviceTypes: p.serviceTypes,
    price: serviceKey ? (p.pricing || []).find((x) => x.serviceKey === serviceKey) || null : null,
    rating: p.rating || { average: 0, count: 0 },
    location: p.location,
    coords: p.coords && p.coords.lat != null ? p.coords : null,
  };
}

// GET /api/services/providers?serviceKey=...&srcLat&srcLng  (user)
// Approved, online providers offering the service. With the user's location, only providers whose
// service zones contain that point are returned, nearest first.
exports.listProvidersForService = asyncHandler(async (req, res) => {
  const key = String(req.query.serviceKey || '').toLowerCase().trim();
  if (!key) return res.status(400).json({ message: 'serviceKey is required' });

  const srcLat = Number(req.query.srcLat);
  const srcLng = Number(req.query.srcLng);
  const hasSrc = req.query.srcLat !== undefined && !Number.isNaN(srcLat) && !Number.isNaN(srcLng);

  const filter = { status: 'approved', isOnline: { $ne: false }, serviceTypes: key };
  if (hasSrc) {
    const zones = await zonesContaining(srcLat, srcLng);
    filter.serviceZones = { $in: zones.map((z) => z._id) };
  }

  const providers = await Provider.find(filter);
  const results = providers
    .map((p) => {
      const card = publicProvider(p, key);
      card.distanceKm = hasSrc && card.coords ? Math.round(distanceKm({ lat: srcLat, lng: srcLng }, card.coords) * 10) / 10 : null;
      return card;
    })
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return b.rating.average - a.rating.average;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });

  res.json({ providers: results });
});

// GET /api/services/providers/:id  (user) — full profile with pricing, gallery, service area and reviews
exports.getProviderProfile = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider || provider.status !== 'approved') return res.status(404).json({ message: 'Provider not found' });

  const [zones, reviews] = await Promise.all([
    Zone.find({ _id: { $in: provider.serviceZones } }).select('name serviceLocation'),
    ServiceReview.find({ provider: provider._id }).sort({ createdAt: -1 }).limit(30).populate('user', 'name'),
  ]);

  res.json({
    provider: {
      ...publicProvider(provider),
      phone: provider.phone,
      email: provider.email,
      serviceZones: zones.map((z) => ({ id: z._id, name: z.name })),
    },
    reviews: reviews.map((r) => ({
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      userName: r.user?.name || 'User',
      createdAt: r.createdAt,
    })),
  });
});

// POST /api/services/requests/:id/review  (user) { rating, comment }
exports.createReview = asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
  }

  const request = await ServiceRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (String(request.user) !== String(req.user._id)) return res.status(403).json({ message: 'Not your request' });
  if (request.status !== 'completed') return res.status(400).json({ message: 'You can review a service once it is completed' });
  if (await ServiceReview.exists({ request: request._id })) {
    return res.status(409).json({ message: 'You have already reviewed this service' });
  }

  const review = await ServiceReview.create({
    request: request._id,
    provider: request.provider,
    user: req.user._id,
    rating,
    comment: req.body.comment ? String(req.body.comment).trim().slice(0, 500) : '',
  });

  // Keep the provider's average in step with every review.
  const [agg] = await ServiceReview.aggregate([
    { $match: { provider: request.provider } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Provider.findByIdAndUpdate(request.provider, {
    'rating.average': Math.round((agg?.average || 0) * 10) / 10,
    'rating.count': agg?.count || 0,
  });

  res.status(201).json({ review });
});

// GET /api/services/reviews/mine  (provider)
exports.listMyReviews = asyncHandler(async (req, res) => {
  const [reviews, provider] = await Promise.all([
    ServiceReview.find({ provider: req.user._id }).sort({ createdAt: -1 }).limit(100).populate('user', 'name'),
    Provider.findById(req.user._id).select('rating'),
  ]);
  res.json({
    rating: provider?.rating || { average: 0, count: 0 },
    reviews: reviews.map((r) => ({
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      userName: r.user?.name || 'User',
      createdAt: r.createdAt,
    })),
  });
});
