const crypto = require('crypto');
const Transporter = require('../models/Transporter');
const TransportRequest = require('../models/TransportRequest');
const asyncHandler = require('../utils/asyncHandler');
const pushService = require('../services/push.service');
const commissionService = require('../services/commission.service');

const SEARCH_RADIUS_KM = 75;
const TRANSPORTER_FIELDS = 'name businessName phone vehicleTypes serviceType pricePerKm baseFare';
const USER_FIELDS = 'name phone';

// Haversine distance in km between two lat/lng points.
function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const round1 = (n) => Math.round(n * 10) / 10;
const quoteFor = (transporter, tripKm) => ({
  tripKm: round1(tripKm),
  pricePerKm: transporter.pricePerKm,
  baseFare: transporter.baseFare || 0,
  amount: Math.round((transporter.baseFare || 0) + tripKm * transporter.pricePerKm),
});

function emitUpdate(req, request, event = 'transport:update') {
  const io = req.app.get('io');
  if (!io) return;
  io.to(`user:${request.user._id || request.user}`).emit(event, request);
  io.to(`transporter:${request.transporter._id || request.transporter}`).emit(event, request);
}

// Re-reads the booking without OTP fields, so responses never leak them to the transporter.
async function fetchPublic(id) {
  return TransportRequest.findById(id)
    .populate('user', USER_FIELDS)
    .populate('transporter', TRANSPORTER_FIELDS);
}

async function loadOwnedByTransporter(req, res) {
  const request = await TransportRequest.findById(req.params.id);
  if (!request) {
    res.status(404).json({ message: 'Request not found' });
    return null;
  }
  if (String(request.transporter) !== String(req.user._id)) {
    res.status(403).json({ message: 'Not your request' });
    return null;
  }
  return request;
}

// GET /api/transport/available?srcLat&srcLng&destLat&destLng
exports.listAvailable = asyncHandler(async (req, res) => {
  const srcLat = Number(req.query.srcLat);
  const srcLng = Number(req.query.srcLng);
  if (Number.isNaN(srcLat) || Number.isNaN(srcLng)) {
    return res.status(400).json({ message: 'srcLat and srcLng are required' });
  }
  const destLat = Number(req.query.destLat);
  const destLng = Number(req.query.destLng);
  const hasDest = !Number.isNaN(destLat) && !Number.isNaN(destLng);
  if (!hasDest) {
    return res.status(400).json({ message: 'destLat and destLng are required to price a trip' });
  }

  const transporters = await Transporter.find({
    status: 'approved',
    isOnline: { $ne: false },
    pricePerKm: { $gt: 0 },
    'location.lat': { $exists: true },
    'location.lng': { $exists: true },
  });

  const source = { lat: srcLat, lng: srcLng };
  const tripKm = distanceKm(source, { lat: destLat, lng: destLng });

  const results = transporters
    .map((t) => ({ transporter: t, distanceFromSource: distanceKm(source, t.location) }))
    .filter((r) => r.distanceFromSource <= SEARCH_RADIUS_KM)
    .sort((a, b) => a.distanceFromSource - b.distanceFromSource)
    .map((r) => ({
      transporter: r.transporter.toSafeObject(),
      distanceFromSourceKm: round1(r.distanceFromSource),
      tripDistanceKm: round1(tripKm),
      quote: quoteFor(r.transporter, tripKm),
    }));

  res.json({ transporters: results });
});

// POST /api/transport/requests  (user)
exports.createRequest = asyncHandler(async (req, res) => {
  const { transporterId, source, destination, type, message } = req.body;
  if (!transporterId || !source || !destination) {
    return res.status(400).json({ message: 'transporterId, source and destination are required' });
  }
  for (const point of [source, destination]) {
    if (!point.address || typeof point.lat !== 'number' || typeof point.lng !== 'number') {
      return res.status(400).json({ message: 'Each location needs address, lat and lng' });
    }
  }

  const transporter = await Transporter.findById(transporterId);
  if (!transporter || transporter.status !== 'approved') {
    return res.status(404).json({ message: 'Transporter not found' });
  }
  if (transporter.isOnline === false) {
    return res.status(400).json({ message: 'This transporter is currently offline' });
  }
  if (!(transporter.pricePerKm > 0)) {
    return res.status(400).json({ message: 'This transporter has not set a price yet' });
  }

  // Price is computed here from the trip distance, never taken from the client.
  const quote = quoteFor(transporter, distanceKm(source, destination));

  const request = await TransportRequest.create({
    user: req.user._id,
    transporter: transporter._id,
    source,
    destination,
    type: type === 'shared' ? 'shared' : 'private',
    message,
    quote,
  });

  const populated = await fetchPublic(request._id);

  const io = req.app.get('io');
  if (io) io.to(`transporter:${transporter._id}`).emit('transport:new', populated);
  pushService
    .sendPushToAccount('transporter', transporter._id, {
      title: 'New transport enquiry',
      body: `${populated.user?.name || 'A user'} wants to move a horse for ₹${quote.amount}`,
      data: { type: 'transport:new', requestId: String(request._id) },
    })
    .catch(() => {});

  res.status(201).json({ request: populated });
});

// GET /api/transport/requests  (admin) — optional ?status= filter
exports.listAll = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const requests = await TransportRequest.find(filter)
    .populate('user', USER_FIELDS)
    .populate('transporter', TRANSPORTER_FIELDS)
    .sort({ createdAt: -1 });
  res.json({ requests });
});

// PATCH /api/transport/requests/:id/cancel  (admin)
exports.cancel = asyncHandler(async (req, res) => {
  const request = await TransportRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'pending' && request.status !== 'accepted') {
    return res.status(400).json({ message: 'Only pending or accepted requests can be cancelled' });
  }

  request.status = 'cancelled';
  request.respondedAt = new Date();
  await request.save();

  const populated = await fetchPublic(request._id);
  emitUpdate(req, populated);
  res.json({ request: populated });
});

// GET /api/transport/requests/mine  (user) — includes OTPs the user must share
exports.listMine = asyncHandler(async (req, res) => {
  const requests = await TransportRequest.find({ user: req.user._id })
    .select('+pickupOtp +dropOtp')
    .populate('transporter', TRANSPORTER_FIELDS)
    .sort({ createdAt: -1 });
  res.json({ requests });
});

// GET /api/transport/requests/incoming  (transporter)
exports.listIncoming = asyncHandler(async (req, res) => {
  const requests = await TransportRequest.find({ transporter: req.user._id })
    .populate('user', USER_FIELDS)
    .sort({ createdAt: -1 });
  res.json({ requests });
});

// GET /api/transport/requests/:id  (transporter) — full booking detail for the job screen
exports.getDetail = asyncHandler(async (req, res) => {
  const request = await loadOwnedByTransporter(req, res);
  if (!request) return;
  const populated = await fetchPublic(request._id);
  res.json({ request: populated });
});

// PATCH /api/transport/requests/:id/respond  (transporter) { action: 'accept' | 'reject' }
exports.respond = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'action must be accept or reject' });
  }

  const request = await loadOwnedByTransporter(req, res);
  if (!request) return;
  if (request.status !== 'pending') {
    return res.status(400).json({ message: 'Request already responded to' });
  }

  request.respondedAt = new Date();
  if (action === 'accept') {
    request.status = 'accepted';
    request.stage = 'scheduled';
    // Two codes: the user shows the first at pickup, the second at drop-off.
    request.pickupOtp = String(crypto.randomInt(1000, 10000));
    request.dropOtp = String(crypto.randomInt(1000, 10000));
  } else {
    request.status = 'rejected';
  }
  await request.save();

  const populated = await fetchPublic(request._id);
  emitUpdate(req, populated);
  pushService
    .sendPushToAccount('user', request.user, {
      title: request.status === 'accepted' ? 'Transport request accepted' : 'Transport request declined',
      body:
        request.status === 'accepted'
          ? `${populated.transporter?.businessName || populated.transporter?.name || 'The transporter'} accepted your request. Open the app to see your OTP.`
          : `${populated.transporter?.businessName || populated.transporter?.name || 'The transporter'} declined your request`,
      data: { type: 'transport:update', requestId: String(request._id) },
    })
    .catch(() => {});

  res.json({ request: populated });
});

// PATCH /api/transport/requests/:id/stage  (transporter)
// { action: 'start' } | { action: 'verify_pickup', otp } | { action: 'verify_drop', otp }
exports.advanceStage = asyncHandler(async (req, res) => {
  const { action, otp } = req.body;
  const request = await TransportRequest.findById(req.params.id).select('+pickupOtp +dropOtp');
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (String(request.transporter) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your request' });
  }
  if (request.status !== 'accepted') {
    return res.status(400).json({ message: 'Only accepted bookings can be progressed' });
  }

  if (action === 'start') {
    if (request.stage !== 'scheduled') return res.status(400).json({ message: 'Trip already started' });
    request.stage = 'to_pickup';
  } else if (action === 'verify_pickup') {
    if (request.stage !== 'to_pickup') return res.status(400).json({ message: 'Pickup is not due yet' });
    if (String(otp) !== request.pickupOtp) return res.status(400).json({ message: 'Incorrect pickup OTP' });
    request.stage = 'in_transit';
    request.pickupVerifiedAt = new Date();
  } else if (action === 'verify_drop') {
    if (request.stage !== 'in_transit') return res.status(400).json({ message: 'Delivery is not due yet' });
    if (String(otp) !== request.dropOtp) return res.status(400).json({ message: 'Incorrect delivery OTP' });
    // Settle before marking complete so a failed credit leaves the booking retryable.
    request.settlement = await commissionService.settle({
      role: 'transporter',
      ownerId: req.user._id,
      amount: request.quote.amount,
      description: `Transport booking ${request._id} delivered`,
    });
    request.stage = 'delivered';
    request.status = 'completed';
    request.deliveredAt = new Date();
    request.paymentStatus = 'settled';
  } else {
    return res.status(400).json({ message: 'Unknown action' });
  }

  await request.save();
  const populated = await fetchPublic(request._id);
  emitUpdate(req, populated);
  res.json({ request: populated });
});

// POST /api/transport/requests/:id/location  (transporter) { lat, lng }
exports.updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ message: 'lat and lng must be numbers' });
  }
  const request = await loadOwnedByTransporter(req, res);
  if (!request) return;
  if (request.status !== 'accepted' || !['to_pickup', 'in_transit'].includes(request.stage)) {
    return res.status(400).json({ message: 'Live location is only shared during an active trip' });
  }

  request.transporterLocation = { lat, lng, updatedAt: new Date() };
  await request.save();

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${request.user}`).emit('transport:location', {
      requestId: String(request._id),
      lat,
      lng,
      updatedAt: request.transporterLocation.updatedAt,
    });
  }
  res.json({ ok: true });
});
