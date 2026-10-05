const crypto = require('crypto');
const Transporter = require('../models/Transporter');
const TransportRequest = require('../models/TransportRequest');
const asyncHandler = require('../utils/asyncHandler');
const pushService = require('../services/push.service');
const commissionService = require('../services/commission.service');
const { releaseResources } = require('./transportTrip.controller');

const SEARCH_RADIUS_KM = 75;
const TRANSPORTER_FIELDS = 'name businessName phone vehicleTypes serviceType pricePerKm baseFare';
const USER_FIELDS = 'name phone';

const { distanceKm } = require('../utils/geo');
const SharedTrip = require('../models/SharedTrip');
const sharedService = require('../services/sharedTrip.service');

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

const dayOf = (date) => String(date).slice(0, 10);

// Tells the other customers in a shared group that their share has changed.
async function notifyGroupMembers(req, groupId, exceptId) {
  const io = req.app.get('io');
  if (!io) return;
  const members = await sharedService.activeMembers(groupId);
  for (const m of members) {
    if (String(m._id) === String(exceptId)) continue;
    const doc = await fetchPublic(m._id);
    io.to(`user:${m.user}`).emit('transport:update', doc);
  }
}

// After a member leaves, splits the cost again across whoever remains and tells them.
// Closed groups (trip already started) keep their prices.
async function repriceGroup(groupId, req) {
  const group = await SharedTrip.findById(groupId);
  if (!group) return;
  const remaining = await sharedService.activeMembers(groupId);
  if (!remaining.length) {
    group.status = 'closed';
    await group.save();
    return;
  }
  if (group.status !== 'open') return;
  const transporter = await Transporter.findById(group.transporter);
  await sharedService.recalcGroupQuotes(transporter, group);
  await notifyGroupMembers(req, groupId, null);
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

  const typeFlag = req.query.type === 'shared' ? { sharedEnabled: { $ne: false } } : { dedicatedEnabled: { $ne: false } };
  const transporters = await Transporter.find({
    status: 'approved',
    isOnline: { $ne: false },
    pricePerKm: { $gt: 0 },
    ...typeFlag,
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
  const { transporterId, source, destination, type, message, animals: rawAnimals, scheduledDate } = req.body;
  if (!transporterId || !source || !destination) {
    return res.status(400).json({ message: 'transporterId, source and destination are required' });
  }
  const wantsShared = type === 'shared';
  const animals = wantsShared ? Number(rawAnimals || 1) : 1;
  if (wantsShared) {
    if (!Number.isInteger(animals) || animals < 1) return res.status(400).json({ message: 'Animals must be a whole number, 1 or more' });
    if (!scheduledDate || Number.isNaN(new Date(scheduledDate).getTime())) {
      return res.status(400).json({ message: 'Pick the date for the shared trip' });
    }
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
  if (wantsShared && transporter.sharedEnabled === false) {
    return res.status(400).json({ message: 'This transporter does not take shared transport' });
  }
  if (!wantsShared && transporter.dedicatedEnabled === false) {
    return res.status(400).json({ message: 'This transporter does not take dedicated transport' });
  }

  // Price is computed here from the trip distance, never taken from the client.
  const quote = quoteFor(transporter, distanceKm(source, destination));

  let group = null;
  if (wantsShared) {
    try {
      ({ group } = await sharedService.joinOrCreateGroup({ transporter, source, destination, scheduledDate, animals }));
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  }

  const request = await TransportRequest.create({
    user: req.user._id,
    transporter: transporter._id,
    source,
    destination,
    type: wantsShared ? 'shared' : 'private',
    animals,
    scheduledDate: wantsShared ? dayOf(scheduledDate) : undefined,
    sharedGroup: group?._id,
    message,
    quote,
  });

  // Shared members get their share of the group cost. Everyone else in the group is repriced too.
  if (group) {
    await sharedService.recalcGroupQuotes(transporter, group);
    await notifyGroupMembers(req, group._id, request._id);
  }

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
  await releaseResources(request);
  if (request.sharedGroup) await repriceGroup(request.sharedGroup, req);

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
  const populated = (await fetchPublic(request._id)).toObject();
  if (request.sharedGroup) {
    // Stop order for the shared run (FIFO): pickups and drops follow booking order.
    const members = await sharedService.activeMembers(request.sharedGroup);
    populated.sharedRun = {
      group: request.sharedGroup,
      animalsTotal: members.reduce((s, m) => s + (m.animals || 1), 0),
      stops: members.map((m, i) => ({
        position: i + 1,
        requestId: m._id,
        animals: m.animals || 1,
        pickup: m.source,
        drop: m.destination,
        status: m.status,
        stage: m.stage,
        picked: Boolean(m.pickupVerifiedAt),
        delivered: Boolean(m.deliveredAt),
        isThis: String(m._id) === String(request._id),
      })),
    };
  }
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
  if (request.sharedGroup) await repriceGroup(request.sharedGroup, req);

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
    if (!request.vehicle || !request.driver) {
      return res.status(400).json({ message: 'Assign a vehicle and a driver before starting the trip' });
    }
    request.stage = 'to_pickup';
    // Once a run starts, no new customers can join it.
    if (request.sharedGroup) await SharedTrip.updateOne({ _id: request.sharedGroup }, { status: 'closed' });
  } else if (action === 'verify_pickup') {
    if (request.stage !== 'to_pickup') return res.status(400).json({ message: 'Pickup is not due yet' });
    if (String(otp) !== request.pickupOtp) return res.status(400).json({ message: 'Incorrect pickup OTP' });
    // FIFO: earlier bookings in the same run must be picked up first.
    const waiting = (await sharedService.earlierMembers(request)).filter((m) => !m.pickupVerifiedAt);
    if (waiting.length) return res.status(400).json({ message: 'Pick up the earlier booking in this run first' });
    request.stage = 'in_transit';
    request.pickupVerifiedAt = new Date();
  } else if (action === 'verify_drop') {
    if (request.stage !== 'in_transit') return res.status(400).json({ message: 'Delivery is not due yet' });
    if (String(otp) !== request.dropOtp) return res.status(400).json({ message: 'Incorrect delivery OTP' });
    // FIFO: earlier bookings in the same run must be dropped first.
    const waiting = (await sharedService.earlierMembers(request)).filter((m) => !m.deliveredAt);
    if (waiting.length) return res.status(400).json({ message: 'Drop off the earlier booking in this run first' });
    // Settle before marking complete so a failed credit leaves the booking retryable.
    request.settlement = await commissionService.settle({
      role: 'transporter',
      ownerId: req.user._id,
      amount: request.quote.amount,
      description: `Transport booking ${request._id} delivered`,
    });
    request.stage = 'delivered';
    request.status = 'completed';
    await releaseResources(request);
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
  if (request.paused) return res.status(400).json({ message: 'The trip is paused' });

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
