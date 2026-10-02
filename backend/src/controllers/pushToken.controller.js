const asyncHandler = require('../utils/asyncHandler');
const pushService = require('../services/push.service');

// Any authenticated role (user, transporter, provider, horse-seller,
// store-seller, admin) can register/unregister its own FCM token — same
// endpoint for every mobile app and the admin web panel.
exports.register = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'token is required' });
  await pushService.registerToken(req.role, req.user._id, token);
  res.json({ message: 'Token registered' });
});

exports.unregister = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'token is required' });
  await pushService.unregisterToken(req.role, req.user._id, token);
  res.json({ message: 'Token removed' });
});
