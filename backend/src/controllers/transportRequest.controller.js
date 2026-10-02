const Transporter = require('../models/Transporter');
const TransportRequest = require('../models/TransportRequest');
const asyncHandler = require('../utils/asyncHandler');
const pushService = require('../services/push.service');

const SEARCH_RADIUS_KM = 75;

// Haversine distance in km between two lat/lng points.
function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
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

  const transporters = await Transporter.find({
    status: 'approved',
    'location.lat': { $exists: true },
    'location.lng': { $exists: true },
  });

  const results = transporters
    .map(t => {
      const distanceFromSource = distanceKm({ lat: srcLat, lng: srcLng }, t.location);
      const tripDistance = hasDest
        ? distanceKm({ lat: srcLat, lng: srcLng }, { lat: destLat, lng: destLng })
        : null;
      return { transporter: t, distanceFromSource, tripDistance };
    })
    .filter(r => r.distanceFromSource <= SEARCH_RADIUS_KM)
    .sort((a, b) => a.distanceFromSource - b.distanceFromSource)
    .map(r => ({
      transporter: r.transporter.toSafeObject(),
      distanceFromSourceKm: Math.round(r.distanceFromSource * 10) / 10,
      tripDistanceKm: r.tripDistance === null ? null : Math.round(r.tripDistance * 10) / 10,
    }));

  res.json({ transporters: results });
});

// POST /api/transport/requests
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

  const request = await TransportRequest.create({
    user: req.user._id,
    transporter: transporter._id,
    source,
    destination,
    type: type === 'shared' ? 'shared' : 'private',
    message,
  });

  const populated = await request.populate('user', 'name phone');

  const io = req.app.get('io');
  if (io) {
    io.to(`transporter:${transporter._id}`).emit('transport:new', populated);
  }
  pushService.sendPushToAccount('transporter', transporter._id, {
    title: 'New transport enquiry',
    body: `${populated.user?.name || 'A user'} wants to move a horse from ${source.address} to ${destination.address}`,
    data: { type: 'transport:new', requestId: String(request._id) },
  }).catch(() => {});

  res.status(201).json({ request: populated });
});

// GET /api/transport/requests  (admin) — optional ?status= filter
exports.listAll = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const requests = await TransportRequest.find(filter)
    .populate('user', 'name phone')
    .populate('transporter', 'name businessName phone vehicleTypes serviceType')
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

  const populated = await request
    .populate('user', 'name phone')
    .then(r => r.populate('transporter', 'name businessName phone vehicleTypes serviceType'));

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${request.user}`).emit('transport:update', populated);
    io.to(`transporter:${request.transporter}`).emit('transport:update', populated);
  }

  res.json({ request: populated });
});

// GET /api/transport/requests/mine  (user)
exports.listMine = asyncHandler(async (req, res) => {
  const requests = await TransportRequest.find({ user: req.user._id })
    .populate('transporter', 'name businessName phone vehicleTypes')
    .sort({ createdAt: -1 });
  res.json({ requests });
});

// GET /api/transport/requests/incoming  (transporter)
exports.listIncoming = asyncHandler(async (req, res) => {
  const requests = await TransportRequest.find({ transporter: req.user._id })
    .populate('user', 'name phone')
    .sort({ createdAt: -1 });
  res.json({ requests });
});

// PATCH /api/transport/requests/:id/respond  (transporter)
exports.respond = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'action must be accept or reject' });
  }

  const request = await TransportRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (String(request.transporter) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your request' });
  }
  if (request.status !== 'pending') {
    return res.status(400).json({ message: 'Request already responded to' });
  }

  request.status = action === 'accept' ? 'accepted' : 'rejected';
  request.respondedAt = new Date();
  await request.save();

  const populated = await request.populate('transporter', 'name businessName phone vehicleTypes');

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${request.user}`).emit('transport:update', populated);
  }
  pushService.sendPushToAccount('user', request.user, {
    title: request.status === 'accepted' ? 'Transport request accepted' : 'Transport request declined',
    body:
      request.status === 'accepted'
        ? `${populated.transporter?.businessName || populated.transporter?.name || 'The transporter'} accepted your request`
        : `${populated.transporter?.businessName || populated.transporter?.name || 'The transporter'} declined your request`,
    data: { type: 'transport:update', requestId: String(request._id) },
  }).catch(() => {});

  res.json({ request: populated });
});
