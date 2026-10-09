const TransportRequest = require('../models/TransportRequest');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const TransportReview = require('../models/TransportReview');
const Transporter = require('../models/Transporter');
const asyncHandler = require('../utils/asyncHandler');
const sharedService = require('../services/sharedTrip.service');

const TRIP_PARTY = 'name businessName phone vehicleTypes serviceType pricePerKm baseFare';

// Loads a booking that belongs to the calling transporter.
async function ownBooking(req, res) {
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

// Frees a booking's vehicle and driver. Called when a trip ends or is cancelled.
async function releaseResources(request) {
  // In a shared run the vehicle and driver stay busy until the last member is done.
  if (request.sharedGroup) {
    const stillRunning = await TransportRequest.countDocuments({
      sharedGroup: request.sharedGroup,
      _id: { $ne: request._id },
      status: 'accepted',
    });
    if (stillRunning) return;
  }
  await Promise.all([
    request.vehicle ? Vehicle.updateOne({ _id: request.vehicle }, { isAvailable: true }) : null,
    request.driver ? Driver.updateOne({ _id: request.driver }, { isAvailable: true }) : null,
  ]);
}

async function populated(id) {
  return TransportRequest.findById(id)
    .populate('user', 'name phone')
    .populate('transporter', TRIP_PARTY)
    .populate('vehicle', 'registrationNumber vehicleType')
    .populate('driver', 'name phone');
}

function notify(req, request, doc) {
  const io = req.app.get('io');
  if (!io) return;
  io.to(`user:${request.user}`).emit('transport:update', doc);
  io.to(`transporter:${request.transporter}`).emit('transport:update', doc);
}

// PATCH /api/transport/requests/:id/assign  (transporter) { vehicleId, driverId }
exports.assign = asyncHandler(async (req, res) => {
  const request = await ownBooking(req, res);
  if (!request) return;
  if (request.status !== 'accepted' || !['scheduled', 'to_pickup'].includes(request.stage)) {
    return res.status(400).json({ message: 'Vehicle and driver can be changed only before the trip reaches the user' });
  }

  const { vehicleId, driverId } = req.body;
  if (vehicleId) {
    const vehicle = await Vehicle.findOne({ _id: vehicleId, transporter: req.user._id, active: true });
    if (!vehicle) return res.status(400).json({ message: 'Choose one of your vehicles' });
    if (request.vehicleType && vehicle.vehicleType !== request.vehicleType) {
      return res.status(400).json({ message: 'This booking needs a vehicle of the type the customer booked' });
    }
    const busy = !vehicle.isAvailable && String(request.vehicle) !== String(vehicle._id);
    if (busy) return res.status(400).json({ message: `${vehicle.registrationNumber} is already on another trip` });
    if (request.sharedGroup) {
      // A shared run carries every member's animals, so the vehicle must hold the whole load.
      const members = await sharedService.activeMembers(request.sharedGroup);
      const load = members.reduce((sum, m) => sum + (m.animals || 1), 0);
      if (vehicle.maxAnimals < load) {
        return res.status(400).json({ message: `${vehicle.registrationNumber} holds ${vehicle.maxAnimals} animal(s), but this run has ${load}` });
      }
    }
    if (request.vehicle && String(request.vehicle) !== String(vehicle._id)) await Vehicle.updateOne({ _id: request.vehicle }, { isAvailable: true });
    await Vehicle.updateOne({ _id: vehicle._id }, { isAvailable: false });
    request.vehicle = vehicle._id;
  }
  if (driverId) {
    const driver = await Driver.findOne({ _id: driverId, transporter: req.user._id, active: true });
    if (!driver) return res.status(400).json({ message: 'Choose one of your drivers' });
    const busy = !driver.isAvailable && String(request.driver) !== String(driver._id);
    if (busy) return res.status(400).json({ message: `${driver.name} is already on another trip` });
    if (request.driver && String(request.driver) !== String(driver._id)) await Driver.updateOne({ _id: request.driver }, { isAvailable: true });
    await Driver.updateOne({ _id: driver._id }, { isAvailable: false });
    request.driver = driver._id;
  }
  await request.save();
  // Shared run: the same vehicle and driver apply to every booking that is still waiting to start.
  if (request.sharedGroup) {
    await TransportRequest.updateMany(
      { sharedGroup: request.sharedGroup, _id: { $ne: request._id }, status: 'accepted', stage: 'scheduled' },
      { vehicle: request.vehicle, driver: request.driver }
    );
  }
  const doc = await populated(request._id);
  notify(req, request, doc);
  res.json({ request: doc });
});

// PATCH /api/transport/requests/:id/schedule  (transporter) { pickupScheduledAt }
exports.schedulePickup = asyncHandler(async (req, res) => {
  const request = await ownBooking(req, res);
  if (!request) return;
  if (request.status !== 'accepted' || request.stage !== 'scheduled') {
    return res.status(400).json({ message: 'Pickup can be scheduled only before the trip starts' });
  }
  const when = new Date(req.body.pickupScheduledAt);
  if (Number.isNaN(when.getTime())) return res.status(400).json({ message: 'Pick a valid pickup time' });
  request.pickupScheduledAt = when;
  await request.save();
  if (request.sharedGroup) {
    await TransportRequest.updateMany(
      { sharedGroup: request.sharedGroup, _id: { $ne: request._id }, status: 'accepted', stage: 'scheduled' },
      { pickupScheduledAt: when }
    );
  }
  const doc = await populated(request._id);
  notify(req, request, doc);
  res.json({ request: doc });
});

// PATCH /api/transport/requests/:id/pause  (transporter) { paused }
exports.pauseTrip = asyncHandler(async (req, res) => {
  const request = await ownBooking(req, res);
  if (!request) return;
  if (request.status !== 'accepted' || !['to_pickup', 'in_transit'].includes(request.stage)) {
    return res.status(400).json({ message: 'Only a trip in progress can be paused' });
  }
  if (typeof req.body.paused !== 'boolean') return res.status(400).json({ message: 'paused must be true or false' });
  request.paused = req.body.paused;
  await request.save();
  // A shared run is one vehicle: pausing it pauses it for every customer still on it.
  if (request.sharedGroup) {
    const others = await TransportRequest.find({
      sharedGroup: request.sharedGroup,
      _id: { $ne: request._id },
      status: 'accepted',
      stage: { $in: ['to_pickup', 'in_transit'] },
    });
    for (const m of others) {
      m.paused = request.paused;
      await m.save();
      notify(req, m, await populated(m._id));
    }
  }
  const doc = await populated(request._id);
  notify(req, request, doc);
  res.json({ request: doc });
});

// POST /api/transport/requests/:id/proof  (transporter) { url, note }
exports.uploadProof = asyncHandler(async (req, res) => {
  const request = await ownBooking(req, res);
  if (!request) return;
  if (request.status !== 'accepted' || !['in_transit', 'delivered'].includes(request.stage)) {
    return res.status(400).json({ message: 'Delivery proof can be added once the horse is on the way' });
  }
  const url = req.body.url;
  if (typeof url !== 'string' || !url) return res.status(400).json({ message: 'Upload a photo as proof' });
  request.deliveryProof = { url, note: req.body.note ? String(req.body.note).slice(0, 300) : undefined, uploadedAt: new Date() };
  await request.save();
  res.json({ request: await populated(request._id) });
});

// POST /api/transport/requests/:id/review  (user) { rating, comment }
exports.reviewTrip = asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
  const request = await TransportRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (String(request.user) !== String(req.user._id)) return res.status(403).json({ message: 'Not your request' });
  if (request.status !== 'completed') return res.status(400).json({ message: 'You can review a trip once it is completed' });
  if (request.reviewed) return res.status(409).json({ message: 'You have already reviewed this trip' });

  const review = await TransportReview.create({
    request: request._id,
    transporter: request.transporter,
    user: req.user._id,
    rating,
    comment: req.body.comment ? String(req.body.comment).trim().slice(0, 500) : '',
  });
  request.reviewed = true;
  await request.save();

  const reviews = await TransportReview.find({ transporter: request.transporter }).select('rating');
  const average = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await Transporter.updateOne(
    { _id: request.transporter },
    { 'rating.average': Math.round(average * 10) / 10, 'rating.count': reviews.length }
  );
  res.status(201).json({ review });
});

exports.releaseResources = releaseResources;
