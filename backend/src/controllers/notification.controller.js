const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const pushService = require('../services/push.service');

const ROLES_BY_AUDIENCE = {
  all: ['user', 'horse-seller', 'store-seller', 'provider', 'transporter'],
  users: ['user'],
  'horse-sellers': ['horse-seller'],
  'store-sellers': ['store-seller'],
  providers: ['provider'],
  transporters: ['transporter'],
};

exports.list = asyncHandler(async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
  res.json({ notifications });
});

// GET /api/notifications — any authenticated role, scoped to their audience
exports.listForRole = asyncHandler(async (req, res) => {
  const audienceByRole = {
    user: 'users',
    'horse-seller': 'horse-sellers',
    'store-seller': 'store-sellers',
    provider: 'providers',
    transporter: 'transporters',
  };
  const roleAudience = audienceByRole[req.role];
  const filter = roleAudience ? { audience: { $in: ['all', roleAudience] } } : {};
  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
  res.json({ notifications });
});

exports.broadcast = asyncHandler(async (req, res) => {
  const { title, message, audience } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: 'title and message are required' });
  }
  const resolvedAudience = audience || 'all';
  const notification = await Notification.create({
    title,
    message,
    audience: resolvedAudience,
    createdBy: req.user._id,
  });

  const roles = ROLES_BY_AUDIENCE[resolvedAudience] || [];
  pushService.sendPushToRoles(roles, { title, body: message, data: { type: 'notification:broadcast' } }).catch(() => {});

  res.status(201).json({ notification });
});
