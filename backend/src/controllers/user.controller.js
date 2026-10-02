const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ users });
});

exports.getById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended', 'archived'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

// PATCH /api/users/me — a user editing their own profile.
exports.updateMyProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true, omitUndefined: true });
  res.json({ user: user.toSafeObject() });
});
