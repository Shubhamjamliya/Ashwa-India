const Transporter = require('../models/Transporter');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const TransportRequest = require('../models/TransportRequest');
const TransportReview = require('../models/TransportReview');
const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/payment.service');
const { VEHICLE_TYPES } = require('../models/Vehicle');

const EXPIRY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const ACTIVE_STAGES = ['to_pickup', 'in_transit'];

const pick = (body, keys) => Object.fromEntries(keys.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));
const isUrl = (v) => typeof v === 'string' && /^\/?[\w\-./]+$/.test(v) && v.length < 500;

// ---- KYC ----

// GET /api/transporter-ops/kyc  (transporter)
exports.getKyc = asyncHandler(async (req, res) => {
  const t = await Transporter.findById(req.user._id).select('kyc companyType businessName');
  res.json({ kyc: t.kyc, companyType: t.companyType, businessName: t.businessName });
});

// PUT /api/transporter-ops/kyc  (transporter)
exports.submitKyc = asyncHandler(async (req, res) => {
  const { companyType, identityProof, businessLicense, gst, bank } = req.body;
  const t = await Transporter.findById(req.user._id);
  if (!t) return res.status(404).json({ message: 'Transporter not found' });

  if (companyType !== undefined) {
    if (!['individual', 'company'].includes(companyType)) return res.status(400).json({ message: 'Choose individual or company' });
    t.companyType = companyType;
  }
  if (identityProof !== undefined) {
    if (!isUrl(identityProof?.url)) return res.status(400).json({ message: 'Upload your identity proof' });
    t.kyc.identityProof = { url: identityProof.url, uploadedAt: new Date() };
  }
  if (businessLicense !== undefined) {
    if (!isUrl(businessLicense?.url)) return res.status(400).json({ message: 'Upload your business licence' });
    t.kyc.businessLicense = { url: businessLicense.url, uploadedAt: new Date() };
  }
  if (gst !== undefined) {
    // GST is optional. When given, both the number and the certificate are kept.
    t.kyc.gst = gst?.number
      ? { number: String(gst.number).trim().toUpperCase(), certificate: gst.certificate?.url ? { url: gst.certificate.url, uploadedAt: new Date() } : undefined }
      : undefined;
  }
  if (bank !== undefined) {
    const b = pick(bank, ['accountName', 'accountNumber', 'ifsc', 'bankName']);
    if (!b.accountName || !b.accountNumber || !b.ifsc) return res.status(400).json({ message: 'Account name, number and IFSC are required' });
    t.kyc.bank = { ...b, ifsc: String(b.ifsc).toUpperCase() };
  }

  if (!t.kyc.identityProof?.url || !t.kyc.businessLicense?.url || !t.kyc.bank?.accountNumber) {
    return res.status(400).json({ message: 'Identity proof, business licence and bank details are needed to submit KYC' });
  }
  t.kyc.status = 'submitted';
  t.kyc.submittedAt = new Date();
  t.kyc.rejectionReason = undefined;
  await t.save();
  res.json({ kyc: t.kyc });
});

// PATCH /api/transporter-ops/admin/kyc/:transporterId  (admin) { action: 'verify' | 'reject', reason }
exports.decideKyc = asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  const t = await Transporter.findById(req.params.transporterId);
  if (!t) return res.status(404).json({ message: 'Transporter not found' });
  if (t.kyc.status !== 'submitted') return res.status(400).json({ message: 'KYC is not waiting for review' });

  if (action === 'verify') {
    t.kyc.status = 'verified';
    t.kyc.verifiedAt = new Date();
    t.kyc.rejectionReason = undefined;
  } else if (action === 'reject') {
    if (!reason || !String(reason).trim()) return res.status(400).json({ message: 'Give a reason for rejecting KYC' });
    t.kyc.status = 'rejected';
    t.kyc.rejectionReason = String(reason).trim();
  } else {
    return res.status(400).json({ message: 'action must be verify or reject' });
  }
  await t.save();
  res.json({ kyc: t.kyc });
});

// PATCH /api/transporter-ops/admin/transporters/:transporterId/controls  (admin) { dedicatedEnabled, sharedEnabled }
exports.updateControls = asyncHandler(async (req, res) => {
  const update = pick(req.body, ['dedicatedEnabled', 'sharedEnabled']);
  for (const [k, v] of Object.entries(update)) {
    if (typeof v !== 'boolean') return res.status(400).json({ message: `${k} must be true or false` });
  }
  const t = await Transporter.findByIdAndUpdate(req.params.transporterId, update, { new: true });
  if (!t) return res.status(404).json({ message: 'Transporter not found' });
  res.json({ transporter: t.toSafeObject() });
});

// ---- Vehicles ----

function vehicleFields(body, { partial = false } = {}) {
  const out = pick(body, ['vehicleType', 'registrationNumber', 'capacityKg', 'compartments', 'maxAnimals', 'dedicated', 'shared', 'isAvailable']);
  if (out.vehicleType !== undefined && !VEHICLE_TYPES.includes(out.vehicleType)) return { error: 'Unknown vehicle type' };
  if (!partial && !out.registrationNumber) return { error: 'Registration number is required' };
  if (out.registrationNumber) out.registrationNumber = String(out.registrationNumber).trim().toUpperCase();
  if (body.images !== undefined) {
    if (!Array.isArray(body.images) || body.images.some((u) => !isUrl(u))) return { error: 'Images must be uploaded photos' };
    out.images = body.images.slice(0, 10);
  }
  if (body.documents !== undefined) {
    const docs = {};
    for (const key of ['registrationCertificate', 'insurance', 'fitness']) {
      const d = body.documents[key];
      if (!d) continue;
      if (!isUrl(d.url)) return { error: `Upload the ${key} document` };
      docs[key] = { url: d.url, expiresAt: d.expiresAt ? new Date(d.expiresAt) : undefined };
    }
    out.documents = docs;
  }
  return { update: out };
}

// GET /api/transporter-ops/vehicles  (transporter)
exports.listVehicles = asyncHandler(async (req, res) => {
  res.json({ vehicles: await Vehicle.find({ transporter: req.user._id, active: true }).sort({ createdAt: -1 }) });
});

// POST /api/transporter-ops/vehicles  (transporter)
exports.createVehicle = asyncHandler(async (req, res) => {
  const { error, update } = vehicleFields(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const vehicle = await Vehicle.create({ ...update, transporter: req.user._id });
    res.status(201).json({ vehicle });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A vehicle with this registration number already exists' });
    throw err;
  }
});

// PATCH /api/transporter-ops/vehicles/:id  (transporter)
exports.updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, transporter: req.user._id });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  const { error, update } = vehicleFields(req.body, { partial: true });
  if (error) return res.status(400).json({ message: error });
  Object.assign(vehicle, update);
  await vehicle.save();
  res.json({ vehicle });
});

// DELETE /api/transporter-ops/vehicles/:id  (transporter) — soft delete; blocked while on a trip
exports.deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, transporter: req.user._id });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  const onTrip = await TransportRequest.exists({ vehicle: vehicle._id, status: 'accepted', stage: { $in: ACTIVE_STAGES } });
  if (onTrip) return res.status(400).json({ message: 'This vehicle is on a trip right now' });
  vehicle.active = false;
  vehicle.isAvailable = false;
  await vehicle.save();
  res.json({ ok: true });
});

// ---- Drivers ----

function driverFields(body, { partial = false } = {}) {
  const out = pick(body, ['name', 'phone', 'licenseNumber', 'licenseExpiresAt', 'isAvailable']);
  if (!partial && (!out.name || !out.phone)) return { error: 'Name and phone are required' };
  if (out.licenseExpiresAt) out.licenseExpiresAt = new Date(out.licenseExpiresAt);
  if (body.licenseImage !== undefined) {
    if (body.licenseImage && !isUrl(body.licenseImage)) return { error: 'Upload the driving licence photo' };
    out.licenseImage = body.licenseImage || undefined;
  }
  if (body.idProofImage !== undefined) {
    if (body.idProofImage && !isUrl(body.idProofImage)) return { error: 'Upload the ID proof photo' };
    out.idProofImage = body.idProofImage || undefined;
  }
  return { update: out };
}

// GET /api/transporter-ops/drivers  (transporter)
exports.listDrivers = asyncHandler(async (req, res) => {
  res.json({ drivers: await Driver.find({ transporter: req.user._id, active: true }).sort({ createdAt: -1 }) });
});

// POST /api/transporter-ops/drivers  (transporter)
exports.createDriver = asyncHandler(async (req, res) => {
  const { error, update } = driverFields(req.body);
  if (error) return res.status(400).json({ message: error });
  const driver = await Driver.create({ ...update, transporter: req.user._id });
  res.status(201).json({ driver });
});

// PATCH /api/transporter-ops/drivers/:id  (transporter)
exports.updateDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ _id: req.params.id, transporter: req.user._id });
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  const { error, update } = driverFields(req.body, { partial: true });
  if (error) return res.status(400).json({ message: error });
  Object.assign(driver, update);
  await driver.save();
  res.json({ driver });
});

// DELETE /api/transporter-ops/drivers/:id  (transporter)
exports.deleteDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ _id: req.params.id, transporter: req.user._id });
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  const onTrip = await TransportRequest.exists({ driver: driver._id, status: 'accepted', stage: { $in: ACTIVE_STAGES } });
  if (onTrip) return res.status(400).json({ message: 'This driver is on a trip right now' });
  driver.active = false;
  driver.isAvailable = false;
  await driver.save();
  res.json({ ok: true });
});

// ---- Alerts & dashboard ----

// GET /api/transporter-ops/alerts  (transporter) — documents that expired or expire within 30 days
exports.expiryAlerts = asyncHandler(async (req, res) => {
  const limit = Date.now() + EXPIRY_WINDOW_MS;
  const vehicles = await Vehicle.find({ transporter: req.user._id, active: true });
  const drivers = await Driver.find({ transporter: req.user._id, active: true });
  const alerts = [];
  for (const v of vehicles) {
    for (const [key, doc] of Object.entries(v.documents?.toObject?.() || v.documents || {})) {
      if (doc?.expiresAt && new Date(doc.expiresAt).getTime() <= limit) {
        alerts.push({ kind: 'vehicle', ref: v.registrationNumber, document: key, expiresAt: doc.expiresAt, expired: new Date(doc.expiresAt).getTime() < Date.now() });
      }
    }
  }
  for (const d of drivers) {
    if (d.licenseExpiresAt && new Date(d.licenseExpiresAt).getTime() <= limit) {
      alerts.push({ kind: 'driver', ref: d.name, document: 'licence', expiresAt: d.licenseExpiresAt, expired: new Date(d.licenseExpiresAt).getTime() < Date.now() });
    }
  }
  res.json({ alerts });
});

// GET /api/transporter-ops/dashboard  (transporter) — counts for the home screen
exports.dashboard = asyncHandler(async (req, res) => {
  const id = req.user._id;
  const [total, active, upcoming, completed, vehicles, drivers, freeVehicles] = await Promise.all([
    TransportRequest.countDocuments({ transporter: id }),
    TransportRequest.countDocuments({ transporter: id, status: 'accepted', stage: { $in: ACTIVE_STAGES } }),
    TransportRequest.countDocuments({ transporter: id, status: 'accepted', stage: 'scheduled' }),
    TransportRequest.countDocuments({ transporter: id, status: 'completed' }),
    Vehicle.countDocuments({ transporter: id, active: true }),
    Driver.countDocuments({ transporter: id, active: true }),
    Vehicle.countDocuments({ transporter: id, active: true, isAvailable: true }),
  ]);
  res.json({ total, active, upcoming, completed, vehicles, drivers, availableVehicles: freeVehicles });
});

// ---- Withdrawals ----

// POST /api/transporter-ops/withdrawals  (transporter) { amount }
exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!(amount > 0)) return res.status(400).json({ message: 'Enter an amount greater than 0' });
  const t = await Transporter.findById(req.user._id);
  if (t.kyc?.status !== 'verified') return res.status(400).json({ message: 'Your KYC must be verified before you can withdraw' });

  const wallet = await paymentService.getOrCreateWallet('transporter', req.user._id);
  const pending = await WithdrawalRequest.aggregate([
    { $match: { transporter: t._id, status: 'requested' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const holdable = wallet.balance - (pending[0]?.total || 0);
  if (amount > holdable) return res.status(400).json({ message: `Your available balance is ₹${Math.max(0, holdable)}` });

  const request = await WithdrawalRequest.create({
    transporter: t._id,
    amount,
    bankSnapshot: { accountName: t.kyc.bank.accountName, accountNumber: t.kyc.bank.accountNumber, ifsc: t.kyc.bank.ifsc, bankName: t.kyc.bank.bankName },
  });
  res.status(201).json({ withdrawal: request });
});

// GET /api/transporter-ops/withdrawals/mine  (transporter)
exports.myWithdrawals = asyncHandler(async (req, res) => {
  res.json({ withdrawals: await WithdrawalRequest.find({ transporter: req.user._id }).sort({ createdAt: -1 }) });
});

// GET /api/transporter-ops/admin/withdrawals  (admin)
exports.listWithdrawals = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const withdrawals = await WithdrawalRequest.find(filter).populate('transporter', 'name businessName phone').sort({ createdAt: -1 });
  res.json({ withdrawals });
});

// PATCH /api/transporter-ops/admin/withdrawals/:id  (admin) { action: 'approve' | 'reject' | 'paid', note }
// Approve debits the wallet so the money is held. Paid means the bank transfer has been made.
exports.decideWithdrawal = asyncHandler(async (req, res) => {
  const { action, note } = req.body;
  const w = await WithdrawalRequest.findById(req.params.id);
  if (!w) return res.status(404).json({ message: 'Withdrawal not found' });

  if (action === 'approve') {
    if (w.status !== 'requested') return res.status(400).json({ message: 'Only requested withdrawals can be approved' });
    await paymentService.debitWallet('transporter', w.transporter, w.amount, { description: `Withdrawal ${w._id}` });
    w.status = 'approved';
  } else if (action === 'reject') {
    if (w.status !== 'requested') return res.status(400).json({ message: 'Only requested withdrawals can be rejected' });
    w.status = 'rejected';
  } else if (action === 'paid') {
    if (w.status !== 'approved') return res.status(400).json({ message: 'Approve the withdrawal before marking it paid' });
    w.status = 'paid';
  } else {
    return res.status(400).json({ message: 'action must be approve, reject or paid' });
  }
  w.decidedAt = new Date();
  if (note) w.note = String(note).trim().slice(0, 200);
  await w.save();
  res.json({ withdrawal: w });
});

// ---- Reviews ----

// GET /api/transporter-ops/reviews/mine  (transporter)
exports.myReviews = asyncHandler(async (req, res) => {
  const [reviews, t] = await Promise.all([
    TransportReview.find({ transporter: req.user._id }).sort({ createdAt: -1 }).limit(100).populate('user', 'name'),
    Transporter.findById(req.user._id).select('rating'),
  ]);
  res.json({
    rating: t?.rating || { average: 0, count: 0 },
    reviews: reviews.map((r) => ({ id: r._id, rating: r.rating, comment: r.comment, userName: r.user?.name || 'Customer', createdAt: r.createdAt })),
  });
});

// ---- Live trips & reports (admin) ----

// GET /api/transporter-ops/admin/live-trips  (admin)
exports.liveTrips = asyncHandler(async (req, res) => {
  const trips = await TransportRequest.find({ status: 'accepted', stage: { $in: ['scheduled', ...ACTIVE_STAGES] } })
    .populate('user', 'name phone')
    .populate('transporter', 'name businessName phone')
    .populate('vehicle', 'registrationNumber vehicleType')
    .populate('driver', 'name phone')
    .sort({ updatedAt: -1 });
  res.json({ trips });
});

// GET /api/transporter-ops/admin/reports  (admin)
exports.reports = asyncHandler(async (req, res) => {
  const [byStatus, settled, vehicles, drivers, topTransporters] = await Promise.all([
    TransportRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    TransportRequest.aggregate([
      { $match: { paymentStatus: 'settled' } },
      { $group: { _id: null, bookings: { $sum: 1 }, gross: { $sum: '$settlement.grossAmount' }, commission: { $sum: '$settlement.commission' }, net: { $sum: '$settlement.netAmount' } } },
    ]),
    Vehicle.aggregate([{ $group: { _id: '$isAvailable', count: { $sum: 1 } } }]),
    Driver.aggregate([{ $group: { _id: '$isAvailable', count: { $sum: 1 } } }]),
    TransportRequest.aggregate([
      { $match: { paymentStatus: 'settled' } },
      { $group: { _id: '$transporter', trips: { $sum: 1 }, gross: { $sum: '$settlement.grossAmount' } } },
      { $sort: { gross: -1 } },
      { $limit: 10 },
    ]),
  ]);
  const names = await Transporter.find({ _id: { $in: topTransporters.map((t) => t._id) } }).select('name businessName');
  res.json({
    bookingsByStatus: byStatus,
    revenue: settled[0] || { bookings: 0, gross: 0, commission: 0, net: 0 },
    vehicleUtilisation: vehicles,
    driverAvailability: drivers,
    topTransporters: topTransporters.map((t) => ({
      transporter: names.find((n) => String(n._id) === String(t._id))?.businessName || names.find((n) => String(n._id) === String(t._id))?.name || 'Transporter',
      trips: t.trips,
      gross: t.gross,
    })),
  });
});

// GET /api/transporter-ops/admin/transporters/:transporterId/fleet  (admin)
exports.adminFleet = asyncHandler(async (req, res) => {
  const [vehicles, drivers] = await Promise.all([
    Vehicle.find({ transporter: req.params.transporterId, active: true }),
    Driver.find({ transporter: req.params.transporterId, active: true }),
  ]);
  res.json({ vehicles, drivers });
});

exports.vehicleTypes = (req, res) => res.json({ vehicleTypes: VEHICLE_TYPES });
