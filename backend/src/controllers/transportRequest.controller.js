const crypto = require('crypto');
const Transporter = require('../models/Transporter');
const TransportRequest = require('../models/TransportRequest');
const Vehicle = require('../models/Vehicle');
const VehicleType = require('../models/VehicleType');
const PaymentIntent = require('../models/PaymentIntent');
const SystemSettings = require('../models/SystemSettings');
const asyncHandler = require('../utils/asyncHandler');
const pushService = require('../services/push.service');
const paymentService = require('../services/payment.service');
const commissionService = require('../services/commission.service');
const advanceService = require('../services/transportAdvance.service');
const pricing = require('../services/transportPricing.service');
const { createRazorpayOrder, verifyPaymentSignature } = require('../utils/razorpay');
const { releaseResources } = require('./transportTrip.controller');

const SEARCH_RADIUS_KM = 75;
const TRANSPORTER_FIELDS = 'name businessName phone vehicleTypes serviceType';
const USER_FIELDS = 'name phone';
const HOST_FIELDS = 'source destination animals scheduledDate vehicleType';

const { distanceKm } = require('../utils/geo');
const SharedTrip = require('../models/SharedTrip');
const sharedService = require('../services/sharedTrip.service');

const { dayOf } = sharedService;
const round1 = (n) => Math.round(n * 10) / 10;
const todayStr = () => new Date().toISOString().slice(0, 10);
const nameOf = (t) => t?.businessName || t?.name || 'The transporter';
const idOf = (v) => (v && v._id ? v._id : v);

function emitUpdate(req, request, event = 'transport:update') {
  const io = req.app.get('io');
  if (!io) return;
  io.to(`user:${idOf(request.user)}`).emit(event, request);
  if (request.transporter) io.to(`transporter:${idOf(request.transporter)}`).emit(event, request);
}

function emitToUser(req, userId, event, payload) {
  const io = req.app.get('io');
  if (io) io.to(`user:${userId}`).emit(event, payload);
}

// Tells transporters a request they were offered is gone (taken by someone else, cancelled or expired).
function emitTaken(req, transporterIds, requestId) {
  const io = req.app.get('io');
  if (!io) return;
  for (const id of transporterIds) io.to(`transporter:${id}`).emit('transport:taken', { requestId: String(requestId) });
}

function pushUser(userId, title, body, requestId) {
  pushService
    .sendPushToAccount('user', userId, { title, body, data: { type: 'transport:update', requestId: String(requestId) } })
    .catch(() => {});
}

// Adds the admin vehicle type's name and icon to bookings, so clients can show them.
async function withTypeInfo(docs) {
  const list = docs.map((d) => (d.toObject ? d.toObject() : d));
  const keys = [...new Set(list.flatMap((d) => [d.vehicleType, d.hostRequest?.vehicleType]).filter(Boolean))];
  const types = keys.length ? await VehicleType.find({ key: { $in: keys } }).select('key name icon') : [];
  const byKey = Object.fromEntries(types.map((t) => [t.key, { key: t.key, name: t.name, icon: t.icon }]));
  return list.map((d) => ({ ...d, vehicleTypeInfo: byKey[d.vehicleType || d.hostRequest?.vehicleType] || null }));
}

// Re-reads the booking without OTP fields, so responses never leak them to the transporter.
async function fetchPublic(id) {
  const doc = await TransportRequest.findById(id)
    .populate('user', USER_FIELDS)
    .populate('transporter', TRANSPORTER_FIELDS)
    .populate('hostRequest', HOST_FIELDS);
  if (!doc) return null;
  const [withInfo] = await withTypeInfo([doc]);
  return withInfo;
}

// Tells the customers riding a shared run that their share has changed.
async function notifyGroupMembers(req, groupId, exceptId) {
  const members = await sharedService.activeMembers(groupId);
  for (const m of members) {
    if (String(m._id) === String(exceptId)) continue;
    emitToUser(req, m.user, 'transport:update', await fetchPublic(m._id));
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
  await sharedService.recalcGroupQuotes(group);
  await notifyGroupMembers(req, groupId, null);
}

// Turns down every joiner still waiting on this host, refunding their advance.
async function rejectPendingJoiners(req, hostId, reason) {
  const joiners = await sharedService.pendingJoiners(hostId);
  for (const j of joiners) {
    j.status = 'rejected';
    j.rejectReason = reason;
    j.respondedAt = new Date();
    await j.save();
    await advanceService.refund(j, `Advance refund: ${reason}`);
    emitUpdate(req, await fetchPublic(j._id));
    pushUser(j.user, 'Shared ride not available', reason, j._id);
  }
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

async function sharingEnabled() {
  const settings = await SystemSettings.findOne({ key: 'singleton' }).select('customization');
  return settings?.customization?.transportSharing !== false;
}

// Online transporters near the pickup with an active vehicle of `typeKey` that can carry `animals`.
// Returns [{ transporter, distanceKm }], nearest first.
async function nearbyCarriers({ source, typeKey, animals = 1, typeKeys }) {
  const transporters = await Transporter.find({
    status: 'approved',
    isOnline: { $ne: false },
    dedicatedEnabled: { $ne: false },
    'location.lat': { $exists: true },
    'location.lng': { $exists: true },
  });
  const nearby = transporters
    .map((t) => ({ transporter: t, distanceKm: distanceKm(source, t.location) }))
    .filter((r) => r.distanceKm <= SEARCH_RADIUS_KM);
  const vehicles = await Vehicle.find({
    transporter: { $in: nearby.map((r) => r.transporter._id) },
    active: true,
    dedicated: { $ne: false },
    maxAnimals: { $gte: animals },
    vehicleType: typeKey ? typeKey : { $in: typeKeys || [] },
  }).select('transporter vehicleType');
  const byType = {};
  for (const v of vehicles) {
    byType[v.vehicleType] = byType[v.vehicleType] || new Set();
    byType[v.vehicleType].add(String(v.transporter));
  }
  const carriersOf = (key) =>
    nearby.filter((r) => byType[key]?.has(String(r.transporter._id))).sort((a, b) => a.distanceKm - b.distanceKm);
  return typeKey ? carriersOf(typeKey) : carriersOf;
}

// GET /api/transport/available?srcLat&srcLng&destLat&destLng[&animals][&type=shared&scheduledDate]
// Private: every admin vehicle type with its fare and how many are nearby (like a ride app).
// Shared: accepted bookings by other customers on the same route and day that still have room.
exports.listAvailable = asyncHandler(async (req, res) => {
  const srcLat = Number(req.query.srcLat);
  const srcLng = Number(req.query.srcLng);
  if (Number.isNaN(srcLat) || Number.isNaN(srcLng)) {
    return res.status(400).json({ message: 'srcLat and srcLng are required' });
  }
  const destLat = Number(req.query.destLat);
  const destLng = Number(req.query.destLng);
  if (Number.isNaN(destLat) || Number.isNaN(destLng)) {
    return res.status(400).json({ message: 'destLat and destLng are required to price a trip' });
  }

  const source = { lat: srcLat, lng: srcLng };
  const destination = { lat: destLat, lng: destLng };
  const tripKm = distanceKm(source, destination);
  const animals = Math.max(1, Number(req.query.animals) || 1);

  if (req.query.type === 'shared') {
    const date = req.query.scheduledDate;
    if (!date || Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({ message: 'scheduledDate is required to find shared rides' });
    }
    if (!(await sharingEnabled())) return res.json({ transporters: [] });
    const rides = await sharedService.findHostRides({ source, destination, scheduledDate: date, animals, excludeUser: req.user._id });
    const typeInfo = await withTypeInfo(rides.map((r) => ({ vehicleType: r.host.vehicleType })));
    const results = await Promise.all(
      rides.map(async (r, i) => ({
        transporter: r.transporter.toSafeObject(),
        hostRequestId: r.host._id,
        scheduledDate: r.host.scheduledDate,
        // The journey the vehicle is already making, so the user sees their trip is on its way.
        rideFrom: r.host.source.address,
        rideTo: r.host.destination.address,
        offRouteKm: round1(r.offKm),
        vehicleType: typeInfo[i].vehicleTypeInfo,
        bookedAnimals: r.load,
        seatsLeft: r.capacity - r.load,
        tripDistanceKm: round1(tripKm),
        quote: r.quote,
        fullQuote: pricing.quoteFor(await sharedService.runPricing(r.host), tripKm),
        advance: await advanceService.advanceFor(r.quote.amount),
      }))
    );
    return res.json({ transporters: results });
  }

  const types = await pricing.bookableTypes();
  const carriersOf = await nearbyCarriers({ source, animals, typeKeys: types.map((t) => t.key) });
  const vehicleTypes = await Promise.all(
    types.map(async (t) => {
      const carriers = carriersOf(t.key);
      const quote = pricing.quoteFor(t, tripKm);
      return {
        vehicleType: { key: t.key, name: t.name, description: t.description, icon: t.icon },
        quote,
        advance: await advanceService.advanceFor(quote.amount),
        available: carriers.length,
        nearestKm: carriers.length ? round1(carriers[0].distanceKm) : null,
      };
    })
  );

  res.json({ tripDistanceKm: round1(tripKm), vehicleTypes });
});

// Validates a booking request and prices it on the server. Shared by the advance-payment order and the booking itself.
// Private: { vehicleType } is offered to every nearby carrier of that type.
// Shared: { hostRequestId } joins that accepted booking.
// Returns { error, status } or { type, animals, scheduledDate, quote, advance, vehicleType, offeredTo?, host?, transporter? }.
async function prepareBooking(body, userId) {
  const { source, destination, type, animals: rawAnimals, scheduledDate, hostRequestId } = body;
  const fail = (message, status = 400) => ({ error: message, status });

  if (!source || !destination) return fail('source and destination are required');
  for (const point of [source, destination]) {
    if (!point.address || typeof point.lat !== 'number' || typeof point.lng !== 'number') {
      return fail('Each location needs address, lat and lng');
    }
  }
  const wantsShared = type === 'shared';
  const animals = Number(rawAnimals || 1);
  if (!Number.isInteger(animals) || animals < 1) return fail('Animals must be a whole number, 1 or more');
  if (!scheduledDate) return fail('Pick the travel date');
  if (Number.isNaN(new Date(scheduledDate).getTime())) return fail('Pick a valid travel date');
  if (dayOf(scheduledDate) < todayStr()) return fail('The travel date cannot be in the past');

  if (!wantsShared) {
    const vehicleType = await pricing.bookableType(body.vehicleType);
    if (!vehicleType) return fail('Choose a vehicle type');
    const carriers = await nearbyCarriers({ source, typeKey: vehicleType.key, animals });
    if (!carriers.length) return fail(`No ${vehicleType.name} is available near your pickup right now`);
    const quote = pricing.quoteFor(vehicleType, distanceKm(source, destination));
    return {
      type: 'private',
      animals,
      scheduledDate: dayOf(scheduledDate),
      vehicleType: vehicleType.key,
      vehicleTypeName: vehicleType.name,
      offeredTo: carriers.map((c) => c.transporter._id),
      quote,
      advance: await advanceService.advanceFor(quote.amount),
    };
  }

  if (!(await sharingEnabled())) return fail('Shared transport is turned off right now');
  if (!hostRequestId) return fail('Choose a shared ride to join');
  const host = await TransportRequest.findById(hostRequestId);
  if (!host || !host.transporter) return fail('This shared ride is no longer available', 404);
  const transporter = await Transporter.findById(host.transporter);
  if (!transporter || transporter.status !== 'approved') return fail('This shared ride is no longer available', 404);
  if (transporter.sharedEnabled === false) return fail('This transporter does not take shared transport');
  if (String(host.user) === String(userId)) return fail('You cannot share your own booking');
  if (!(await sharedService.isOpenHost(host)) || host.scheduledDate !== dayOf(scheduledDate)) {
    return fail('This shared ride is no longer available');
  }
  if (!(await sharedService.fitOnRoute(host, source, destination)).fits) {
    return fail('Your trip is not on the way of this shared ride');
  }
  const alreadyAsked = await TransportRequest.exists({
    hostRequest: host._id,
    user: userId,
    status: { $in: ['pending', 'accepted'] },
  });
  if (alreadyAsked) return fail('You have already asked to join this ride');
  const [capacity, load] = await Promise.all([sharedService.capacityFor(host), sharedService.loadFor(host)]);
  if (load + animals > capacity) return fail(`This ride has room for ${Math.max(0, capacity - load)} more animal(s)`);

  const { quote } = await sharedService.estimateJoin(host, { source, destination, animals });
  return {
    type: 'shared',
    animals,
    scheduledDate: host.scheduledDate,
    vehicleType: host.vehicleType,
    quote,
    advance: await advanceService.advanceFor(quote.amount),
    host,
    transporter,
  };
}

// POST /api/transport/advance/razorpay-order  (user) — same body as a booking; opens a Razorpay order for its advance
exports.createAdvanceOrder = asyncHandler(async (req, res) => {
  const booking = await prepareBooking(req.body, req.user._id);
  if (booking.error) return res.status(booking.status).json({ message: booking.error });
  if (!(booking.advance > 0)) return res.status(400).json({ message: 'No advance is needed for this booking' });

  const intent = await paymentService.createIntent({
    idempotencyKey: req.body.idempotencyKey,
    payerType: 'user',
    payerId: req.user._id,
    purpose: 'transport-booking',
    amount: booking.advance,
    method: 'razorpay',
  });
  if (intent.status === 'paid') return res.status(400).json({ message: 'This advance has already been paid' });

  const razorpayOrder = await createRazorpayOrder({
    amount: intent.amount,
    receipt: `transport_${intent._id}`,
    notes: { intentId: String(intent._id), payerId: String(req.user._id) },
  });
  await paymentService.markIntentPendingRazorpay(intent._id, razorpayOrder.id);

  res.json({
    paymentIntentId: intent._id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// Confirms a Razorpay advance. Returns the paid intent, or { error }.
async function verifyRazorpayAdvance(body, userId, expectedAmount) {
  const { paymentIntentId, razorpayPaymentId, razorpaySignature } = body;
  if (!paymentIntentId) return { error: 'paymentIntentId is required' };
  let intent = await PaymentIntent.findById(paymentIntentId);
  if (!intent || intent.purpose !== 'transport-booking') return { error: 'Payment not found' };
  if (String(intent.payerId) !== String(userId)) return { error: 'Not your payment' };
  if (intent.referenceId) return { error: 'This payment is already used for a booking' };
  if (intent.status === 'refunded') return { error: 'This payment was already returned to your wallet' };
  if (intent.status !== 'paid') {
    const valid = verifyPaymentSignature({ razorpayOrderId: intent.razorpay?.orderId, razorpayPaymentId, razorpaySignature });
    if (!valid) return { error: 'Payment verification failed' };
    intent = await paymentService.markIntentPaid(intent._id, { razorpayPaymentId, razorpaySignature });
  }
  if (expectedAmount !== undefined && intent.amount !== expectedAmount) {
    return { error: 'The price changed after payment. Please book again.', intent };
  }
  return { intent };
}

// A Razorpay advance that cannot be used (booking no longer valid) goes to the user's wallet instead of being lost.
async function parkUnusedAdvance(intent, userId) {
  if (!intent) return false;
  // Claim the intent first so two concurrent calls can never both credit it.
  const claimed = await PaymentIntent.findOneAndUpdate(
    { _id: intent._id, status: 'paid', referenceId: { $exists: false } },
    { status: 'refunded' }
  );
  if (!claimed) return false;
  await paymentService.creditWallet('user', userId, claimed.amount, {
    paymentIntentId: claimed._id,
    description: 'Transport advance returned (booking could not be made)',
  });
  return true;
}

// POST /api/transport/requests  (user)
// Private: { vehicleType, source, destination, scheduledDate, animals }
// Shared:  { type: 'shared', hostRequestId, source, destination, scheduledDate, animals }
// Payment: method 'wallet' | 'razorpay' (+ paymentIntentId, razorpayPaymentId, razorpaySignature)
exports.createRequest = asyncHandler(async (req, res) => {
  const booking = await prepareBooking(req.body, req.user._id);
  const method = req.body.method || 'wallet';

  if (booking.error) {
    // The user may already have paid online for a ride that filled up meanwhile; keep that money in their wallet.
    if (method === 'razorpay' && req.body.paymentIntentId) {
      const { intent } = await verifyRazorpayAdvance(req.body, req.user._id);
      if (await parkUnusedAdvance(intent, req.user._id)) {
        return res.status(booking.status).json({ message: `${booking.error}. Your advance was added to your wallet.` });
      }
    }
    return res.status(booking.status).json({ message: booking.error });
  }

  let intent = null;
  if (booking.advance > 0) {
    if (method === 'wallet') {
      intent = await paymentService.createIntent({
        payerType: 'user',
        payerId: req.user._id,
        purpose: 'transport-booking',
        amount: booking.advance,
        method: 'wallet',
      });
      try {
        intent = await paymentService.payIntentFromWallet(intent._id, 'user', req.user._id);
      } catch (err) {
        await paymentService.markIntentFailed(intent._id, err.message);
        return res.status(400).json({ message: 'Not enough wallet balance for the advance. Add money or pay online.' });
      }
    } else if (method === 'razorpay') {
      const result = await verifyRazorpayAdvance(req.body, req.user._id, booking.advance);
      if (result.error) {
        if (await parkUnusedAdvance(result.intent, req.user._id)) {
          return res.status(400).json({ message: `${result.error} Your advance was added to your wallet.` });
        }
        return res.status(400).json({ message: result.error });
      }
      intent = result.intent;
    } else {
      return res.status(400).json({ message: 'Unknown payment method' });
    }
  }

  const { host } = booking;
  const group = host ? await sharedService.groupForHost(host) : null;

  const request = await TransportRequest.create({
    user: req.user._id,
    transporter: host ? booking.transporter._id : undefined,
    vehicleType: booking.vehicleType,
    offeredTo: booking.offeredTo || [],
    source: req.body.source,
    destination: req.body.destination,
    type: booking.type,
    animals: booking.animals,
    scheduledDate: booking.scheduledDate,
    sharedGroup: group?._id,
    hostRequest: host?._id,
    shareApproval: host ? 'pending' : undefined,
    message: req.body.message,
    quote: booking.quote,
    advance: intent
      ? { amount: intent.amount, method: intent.method, paymentIntent: intent._id, status: 'paid' }
      : { amount: 0, status: 'none' },
  });
  if (intent) await paymentService.attachReference(intent._id, 'TransportRequest', request._id);

  const populated = await fetchPublic(request._id);

  if (host) {
    // The host's customer decides first. The transporter sees this enquiry only after they agree.
    const { hostQuote } = await sharedService.estimateJoin(host, request);
    emitToUser(req, host.user, 'transport:share-request', { requestId: String(request._id), hostRequestId: String(host._id) });
    pushUser(
      host.user,
      'Someone wants to share your ride',
      `A customer on your route wants to share your transport on ${host.scheduledDate}.` +
        (hostQuote ? ` Your price would drop to about ₹${hostQuote.amount}.` : '') +
        ' Open My Bookings to accept or decline.',
      host._id
    );
  } else {
    // Offered to every nearby carrier of the type; the first to accept gets it.
    const io = req.app.get('io');
    for (const id of booking.offeredTo) {
      if (io) io.to(`transporter:${id}`).emit('transport:new', populated);
      pushService
        .sendPushToAccount('transporter', id, {
          title: `New ${booking.vehicleTypeName} request`,
          body: `${populated.user?.name || 'A user'} wants to move ${booking.animals} horse(s) for ₹${booking.quote.amount}. Accept first to get it.`,
          data: { type: 'transport:new', requestId: String(request._id) },
        })
        .catch(() => {});
    }
  }

  res.status(201).json({ request: populated, offeredTo: booking.offeredTo?.length || 0 });
});

// GET /api/transport/requests  (admin) — optional ?status= filter
exports.listAll = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const requests = await TransportRequest.find(filter)
    .populate('user', USER_FIELDS)
    .populate('transporter', TRANSPORTER_FIELDS)
    .sort({ createdAt: -1 });
  res.json({ requests: await withTypeInfo(requests) });
});

// Ends a booking that never ran: refunds the advance, frees resources, and tidies up shared riders and offers.
async function closeBooking(req, request, status, reason) {
  const offered = request.transporter ? [] : request.offeredTo || [];
  request.status = status;
  request.rejectReason = reason;
  request.respondedAt = new Date();
  await request.save();
  await releaseResources(request);
  await advanceService.refund(request, `Advance refund: ${reason}`);
  if (!request.hostRequest) await rejectPendingJoiners(req, request._id, 'The ride you asked to share was cancelled');
  if (request.sharedGroup) await repriceGroup(request.sharedGroup, req);
  emitTaken(req, offered, request._id);
  const populated = await fetchPublic(request._id);
  emitUpdate(req, populated);
  return populated;
}

// PATCH /api/transport/requests/:id/cancel  (admin)
exports.cancel = asyncHandler(async (req, res) => {
  const request = await TransportRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'pending' && request.status !== 'accepted') {
    return res.status(400).json({ message: 'Only pending or accepted requests can be cancelled' });
  }
  res.json({ request: await closeBooking(req, request, 'cancelled', 'Cancelled by admin') });
});

// PATCH /api/transport/requests/:id/cancel-mine  (user) — only while no transporter has accepted
exports.cancelMine = asyncHandler(async (req, res) => {
  const request = await TransportRequest.findById(req.params.id);
  if (!request || String(request.user) !== String(req.user._id)) return res.status(404).json({ message: 'Booking not found' });
  if (request.status !== 'pending') {
    return res.status(400).json({ message: 'A transporter has already responded. Contact support to cancel.' });
  }
  res.json({ request: await closeBooking(req, request, 'cancelled', 'You cancelled this request') });
});

// GET /api/transport/requests/mine  (user) — includes OTPs the user must share,
// and requests from other customers asking to share this user's rides.
exports.listMine = asyncHandler(async (req, res) => {
  const requests = await TransportRequest.find({ user: req.user._id })
    .select('+pickupOtp +dropOtp')
    .populate('transporter', TRANSPORTER_FIELDS)
    .populate('hostRequest', HOST_FIELDS)
    .sort({ createdAt: -1 });

  const hostIds = requests.filter((r) => r.status === 'accepted' && !r.hostRequest).map((r) => r._id);
  const asks = await TransportRequest.find({ hostRequest: { $in: hostIds }, status: 'pending', shareApproval: 'pending' }).sort({
    createdAt: 1,
  });
  const shareRequests = await Promise.all(
    asks.map(async (a) => {
      const host = requests.find((r) => String(r._id) === String(a.hostRequest));
      const { hostQuote } = await sharedService.estimateJoin(host, a);
      return {
        _id: a._id,
        hostRequest: a.hostRequest,
        animals: a.animals,
        source: a.source,
        destination: a.destination,
        scheduledDate: a.scheduledDate,
        currentAmount: host.quote.amount,
        newAmount: hostQuote?.amount ?? null,
        createdAt: a.createdAt,
      };
    })
  );

  res.json({ requests: await withTypeInfo(requests), shareRequests });
});

// PATCH /api/transport/requests/:id/share-consent  (user, host's customer) { action: 'approve' | 'decline' }
exports.shareConsent = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!['approve', 'decline'].includes(action)) return res.status(400).json({ message: 'action must be approve or decline' });

  const request = await TransportRequest.findById(req.params.id);
  if (!request || !request.hostRequest) return res.status(404).json({ message: 'Share request not found' });
  const host = await TransportRequest.findById(request.hostRequest);
  if (!host || String(host.user) !== String(req.user._id)) return res.status(403).json({ message: 'Not your ride' });
  if (request.status !== 'pending' || request.shareApproval !== 'pending') {
    return res.status(400).json({ message: 'This request has already been answered' });
  }

  request.shareApproval = action === 'approve' ? 'approved' : 'declined';
  if (action === 'decline') {
    request.status = 'rejected';
    request.rejectReason = 'The other customer chose not to share the ride';
    request.respondedAt = new Date();
  }
  await request.save();

  const populated = await fetchPublic(request._id);
  if (action === 'decline') {
    await advanceService.refund(request, 'Advance refund: shared ride declined');
    emitToUser(req, request.user, 'transport:update', populated);
    pushUser(request.user, 'Shared ride declined', 'The other customer chose not to share. Your advance is back in your wallet.', request._id);
  } else {
    emitToUser(req, request.user, 'transport:update', populated);
    pushUser(request.user, 'Customer agreed to share', 'Waiting for the transporter to confirm your shared ride.', request._id);
    const io = req.app.get('io');
    if (io) io.to(`transporter:${request.transporter}`).emit('transport:new', populated);
    pushService
      .sendPushToAccount('transporter', request.transporter, {
        title: 'New shared ride enquiry',
        body: `${populated.user?.name || 'A user'} wants to join a booking you accepted on ${request.scheduledDate}`,
        data: { type: 'transport:new', requestId: String(request._id) },
      })
      .catch(() => {});
  }

  res.json({ request: populated });
});

// GET /api/transport/requests/incoming  (transporter)
// Own bookings, plus open requests offered to this transporter that nobody has taken yet.
// Shared enquiries appear only once the host's customer agreed.
exports.listIncoming = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const requests = await TransportRequest.find({
    shareApproval: { $nin: ['pending', 'declined'] },
    $or: [{ transporter: me }, { transporter: null, status: 'pending', offeredTo: me, declinedBy: { $ne: me } }],
  })
    .populate('user', USER_FIELDS)
    .populate('hostRequest', HOST_FIELDS)
    .sort({ createdAt: -1 });
  const list = await withTypeInfo(requests);

  // Bookings that ride one shared run carry the run's summary, so the app shows the run as one trip.
  const groupIds = [
    ...new Set(
      list
        .filter((r) => r.sharedGroup && String(r.transporter) === String(me) && ['accepted', 'completed'].includes(r.status))
        .map((r) => String(r.sharedGroup))
    ),
  ];
  const runs = {};
  for (const gid of groupIds) {
    const { stops, members, ...summary } = await runSummary(gid);
    runs[gid] = { ...summary, members: members.map(({ requestId, name, animals, pickup, drop, stage, status }) => ({ requestId, name, animals, pickup, drop, stage, status })), stops };
  }
  for (const r of list) {
    const run = r.sharedGroup && runs[String(r.sharedGroup)];
    if (run && run.customers > 1) r.run = run;
  }
  res.json({ requests: list });
});

// GET /api/transport/requests/:id  (transporter) — full booking detail for the job screen
exports.getDetail = asyncHandler(async (req, res) => {
  const request = await TransportRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  const me = String(req.user._id);
  const mine = String(request.transporter) === me;
  // An open request offered to this transporter (and not declined by them) can be viewed before accepting.
  const offeredToMe =
    !request.transporter &&
    request.status === 'pending' &&
    (request.offeredTo || []).some((id) => String(id) === me) &&
    !(request.declinedBy || []).some((id) => String(id) === me);
  // A shared request stays hidden until the first customer agrees to share, as in the incoming list.
  const awaitingHost = request.hostRequest && request.shareApproval !== 'approved';
  if (!mine && !offeredToMe) return res.status(403).json({ message: 'Not your request' });
  if (awaitingHost) return res.status(404).json({ message: 'Request not found' });
  const populated = await fetchTracking(request._id);
  populated.openOffer = offeredToMe;
  if (request.sharedGroup && mine) populated.sharedRun = await runSummary(request.sharedGroup, request._id);
  res.json({ request: populated });
});

const firstName = (u) => String(u?.name || u?.phone || 'customer').split(' ')[0];
const placeName = (pt) => String(pt?.address || '').split(',')[0];

// "Pick up Ravi at Indore" / "Drop Ravi at Dewas"
function describeStop(stop) {
  const who = firstName(stop.member.user);
  return stop.kind === 'pickup'
    ? `Pick up ${who} at ${placeName(stop.member.source)}`
    : `Drop ${who} at ${placeName(stop.member.destination)}`;
}

// One shared trip as the transporter runs it: every stop in road order, which are done, and what is next.
// Never includes OTPs.
async function runSummary(groupId, thisId) {
  const { members, stops, next } = await sharedService.runPlan(groupId);
  const doneCount = stops.filter((st) => st.done).length;
  return {
    group: groupId,
    customers: members.length,
    animalsTotal: members.reduce((sum, m) => sum + (m.animals || 1), 0),
    started: members.some((m) => m.stage && m.stage !== 'scheduled'),
    finished: stops.length > 0 && !next,
    doneCount,
    totalStops: stops.length,
    next: next
      ? { kind: next.kind, requestId: next.member._id, label: describeStop(next), point: next.kind === 'pickup' ? next.member.source : next.member.destination }
      : null,
    members: members.map((m) => ({
      requestId: m._id,
      name: m.user?.name || m.user?.phone || 'Customer',
      phone: m.user?.phone,
      animals: m.animals || 1,
      pickup: m.source,
      drop: m.destination,
      stage: m.stage,
      status: m.status,
      fare: m.quote?.amount,
      isThis: String(m._id) === String(thisId),
    })),
    stops: stops.map((st, i) => ({
      position: i + 1,
      kind: st.kind,
      requestId: st.member._id,
      name: st.member.user?.name || st.member.user?.phone || 'Customer',
      phone: st.member.user?.phone,
      animals: st.member.animals || 1,
      point: st.kind === 'pickup' ? st.member.source : st.member.destination,
      label: describeStop(st),
      done: st.done,
      isNext: next === st,
    })),
  };
}

const newOtps = () => ({
  // Two codes: the user shows the first at pickup, the second at drop-off.
  pickupOtp: String(crypto.randomInt(1000, 10000)),
  dropOtp: String(crypto.randomInt(1000, 10000)),
});

function notifyUserOfAnswer(request, populated) {
  pushUser(
    request.user,
    request.status === 'accepted' ? 'Transport request accepted' : 'Transport request declined',
    request.status === 'accepted'
      ? `${nameOf(populated.transporter)} accepted your request. Open the app to see your OTP.`
      : `${request.rejectReason || 'Your request was declined'}.` + (request.advance?.amount > 0 ? ' Your advance is back in your wallet.' : ''),
    request._id
  );
}

// An open (offered) request: the first transporter to accept gets it; a decline just drops this transporter.
async function respondToOffer(req, res, request, action) {
  const me = req.user._id;
  const offered = (request.offeredTo || []).map(String);
  if (!offered.includes(String(me))) return res.status(403).json({ message: 'This request was not sent to you' });

  if (action === 'accept') {
    const vehicle = await Vehicle.exists({
      transporter: me,
      active: true,
      vehicleType: request.vehicleType,
      maxAnimals: { $gte: request.animals || 1 },
    });
    if (!vehicle) return res.status(400).json({ message: 'You need an active vehicle of this type to accept' });

    // Atomic claim: only one transporter can move it from "open" to "accepted".
    const claimed = await TransportRequest.findOneAndUpdate(
      { _id: request._id, status: 'pending', transporter: null },
      { transporter: me, status: 'accepted', stage: 'scheduled', respondedAt: new Date(), ...newOtps() },
      { new: true }
    );
    if (!claimed) return res.status(409).json({ message: 'Another transporter has already accepted this request' });

    emitTaken(req, offered.filter((id) => id !== String(me)), claimed._id);
    const populated = await fetchPublic(claimed._id);
    emitUpdate(req, populated);
    notifyUserOfAnswer(claimed, populated);
    return res.json({ request: populated });
  }

  await TransportRequest.updateOne({ _id: request._id }, { $pull: { offeredTo: me }, $addToSet: { declinedBy: me } });
  // Once everyone offered has declined, the request ends and the advance goes back.
  const ended = await TransportRequest.findOneAndUpdate(
    { _id: request._id, status: 'pending', transporter: null, offeredTo: { $size: 0 } },
    { status: 'rejected', rejectReason: 'No transporter could take this request', respondedAt: new Date() },
    { new: true }
  );
  if (ended) {
    await advanceService.refund(ended, 'Advance refund: no transporter available');
    const populated = await fetchPublic(ended._id);
    emitUpdate(req, populated);
    notifyUserOfAnswer(ended, populated);
  }
  return res.json({ request: { _id: request._id, declined: true } });
}

// PATCH /api/transport/requests/:id/respond  (transporter) { action: 'accept' | 'reject' }
exports.respond = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'action must be accept or reject' });
  }

  const found = await TransportRequest.findById(req.params.id);
  if (!found) return res.status(404).json({ message: 'Request not found' });
  if (found.status !== 'pending') return res.status(400).json({ message: 'Request already responded to' });
  if (!found.transporter) return respondToOffer(req, res, found, action);

  const request = await loadOwnedByTransporter(req, res);
  if (!request) return;
  if (request.hostRequest && request.shareApproval !== 'approved') {
    return res.status(400).json({ message: 'The other customer has not agreed to share yet' });
  }

  let host = null;
  if (action === 'accept' && request.hostRequest) {
    // The run must still be open and have room once everyone already riding is counted.
    host = await TransportRequest.findById(request.hostRequest);
    if (!(await sharedService.isOpenHost(host))) {
      return res.status(400).json({ message: 'The original booking has started or ended. Decline this request.' });
    }
    const riding = await sharedService.activeMembers(request.sharedGroup);
    const load = riding.reduce((s, m) => s + (m.animals || 1), 0);
    const capacity = await sharedService.capacityFor(host);
    if (load + request.animals > capacity) {
      return res.status(400).json({ message: `The vehicle has room for ${Math.max(0, capacity - load)} more animal(s)` });
    }
  }

  request.respondedAt = new Date();
  if (action === 'accept') {
    request.status = 'accepted';
    request.stage = 'scheduled';
    Object.assign(request, newOtps());
    // A joiner rides in the host's vehicle with the host's driver.
    if (host) {
      request.vehicle = host.vehicle;
      request.driver = host.driver;
      request.pickupScheduledAt = host.pickupScheduledAt;
    }
  } else {
    request.status = 'rejected';
    request.rejectReason = 'The transporter declined this request';
  }
  await request.save();

  if (request.status === 'rejected') {
    await advanceService.refund(request, 'Advance refund: transporter declined');
    if (!request.hostRequest) await rejectPendingJoiners(req, request._id, 'The ride you asked to share is no longer running');
  }
  if (request.sharedGroup && request.status === 'accepted') {
    // Everyone on the run now pays a smaller share.
    const group = await SharedTrip.findById(request.sharedGroup);
    await sharedService.recalcGroupQuotes(group);
    await notifyGroupMembers(req, group._id, request._id);
    const updatedHost = await TransportRequest.findById(request.hostRequest).select('user quote');
    if (updatedHost) {
      pushUser(updatedHost.user, 'Your ride is now shared', `Your transport price dropped to ₹${updatedHost.quote.amount}.`, updatedHost._id);
    }
  }

  const populated = await fetchPublic(request._id);
  emitUpdate(req, populated);
  notifyUserOfAnswer(request, populated);
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
    // Once a run starts, no new customers can join it, and anyone still waiting is turned down.
    if (request.sharedGroup) {
      const group = await SharedTrip.findByIdAndUpdate(request.sharedGroup, { status: 'closed' });
      if (group?.host) await rejectPendingJoiners(req, group.host, 'The trip has already started');
      // A shared run is one trip: starting it starts it for every customer on board.
      const others = await TransportRequest.find({
        sharedGroup: request.sharedGroup,
        _id: { $ne: request._id },
        status: 'accepted',
        stage: 'scheduled',
      });
      for (const m of others) {
        m.stage = 'to_pickup';
        m.vehicle = m.vehicle || request.vehicle;
        m.driver = m.driver || request.driver;
        await m.save();
        emitUpdate(req, await fetchPublic(m._id));
        pushUser(m.user, 'Your transport has started', 'The transporter is on the way. Keep your pickup OTP ready.', m._id);
      }
    } else if (!request.hostRequest) {
      await rejectPendingJoiners(req, request._id, 'The trip has already started');
    }
  } else if (action === 'verify_pickup') {
    if (request.stage !== 'to_pickup') return res.status(400).json({ message: 'Pickup is not due yet' });
    // Shared run: stops go in road order, so check the order before the OTP.
    const blocking = await sharedService.blockingStops(request, 'pickup');
    if (blocking.length) return res.status(400).json({ message: `Not yet. Next stop: ${describeStop(blocking[0])}` });
    if (String(otp) !== request.pickupOtp) return res.status(400).json({ message: 'Incorrect pickup OTP' });
    request.stage = 'in_transit';
    request.pickupVerifiedAt = new Date();
  } else if (action === 'verify_drop') {
    if (request.stage !== 'in_transit') return res.status(400).json({ message: 'Delivery is not due yet' });
    const blocking = await sharedService.blockingStops(request, 'drop');
    if (blocking.length) return res.status(400).json({ message: `Not yet. Next stop: ${describeStop(blocking[0])}` });
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
    await releaseResources(request);
    request.deliveredAt = new Date();
    request.paymentStatus = 'settled';
  } else {
    return res.status(400).json({ message: 'Unknown action' });
  }

  await request.save();
  const populated = await fetchPublic(request._id);
  emitUpdate(req, populated);
  if (request.sharedGroup) populated.sharedRun = await runSummary(request.sharedGroup, request._id);
  res.json({ request: populated });
});

// The trail keeps a point only when the vehicle has moved this far, so GPS jitter while parked adds nothing.
const TRAIL_MIN_STEP_KM = 0.02;
const TRAIL_MAX_POINTS = 2000;

// POST /api/transport/requests/:id/location  (transporter) { lat, lng, heading? }
exports.updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number' || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return res.status(400).json({ message: 'lat and lng must be valid numbers' });
  }
  const heading = typeof req.body.heading === 'number' && Number.isFinite(req.body.heading) ? req.body.heading : undefined;
  const request = await loadOwnedByTransporter(req, res);
  if (!request) return;
  if (request.status !== 'accepted' || !['to_pickup', 'in_transit'].includes(request.stage)) {
    return res.status(400).json({ message: 'Live location is only shared during an active trip' });
  }
  if (request.paused) return res.status(400).json({ message: 'The trip is paused' });

  const now = new Date();
  const previous = request.transporterLocation;
  const moved = previous?.lat == null || distanceKm(previous, { lat, lng }) >= TRAIL_MIN_STEP_KM;
  // One vehicle carries the whole shared run, so every customer still on it sees the same position.
  const riders = request.sharedGroup
    ? await TransportRequest.find({
        sharedGroup: request.sharedGroup,
        status: 'accepted',
        stage: { $in: ['to_pickup', 'in_transit'] },
      }).select('user')
    : [request];
  await TransportRequest.updateMany(
    { _id: { $in: riders.map((r) => r._id) } },
    {
      $set: { transporterLocation: { lat, lng, heading, updatedAt: now } },
      ...(moved ? { $push: { trail: { $each: [{ lat, lng, at: now }], $slice: -TRAIL_MAX_POINTS } } } : {}),
    }
  );

  const io = req.app.get('io');
  if (io) {
    for (const r of riders) {
      io.to(`user:${r.user}`).emit('transport:location', { requestId: String(r._id), lat, lng, heading, updatedAt: now });
    }
  }
  res.json({ ok: true });
});

// Full booking for a tracking screen: vehicle, driver and the path driven so far.
async function fetchTracking(id, { withOtps = false } = {}) {
  const doc = await TransportRequest.findById(id)
    .select(withOtps ? '+trail +pickupOtp +dropOtp' : '+trail')
    .populate('user', USER_FIELDS)
    .populate('transporter', TRANSPORTER_FIELDS)
    .populate('hostRequest', HOST_FIELDS)
    .populate('vehicle', 'registrationNumber vehicleType')
    .populate('driver', 'name phone');
  if (!doc) return null;
  const [withInfo] = await withTypeInfo([doc]);
  return withInfo;
}

// GET /api/transport/requests/mine/:id  (user) — one booking with OTPs, crew and live-tracking data
exports.getMine = asyncHandler(async (req, res) => {
  const request = await TransportRequest.findById(req.params.id).select('user');
  if (!request || String(request.user) !== String(req.user._id)) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  res.json({ request: await fetchTracking(request._id, { withOtps: true }) });
});
