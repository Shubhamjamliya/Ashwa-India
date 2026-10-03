const Provider = require('../models/Provider');
const ServiceRequest = require('../models/ServiceRequest');
const asyncHandler = require('../utils/asyncHandler');
const pushService = require('../services/push.service');
const commissionService = require('../services/commission.service');

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
