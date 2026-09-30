const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  res.json({ admin: req.user.toSafeObject() });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, profileImage } = req.body;

  if (email && email !== req.user.email) {
    const existing = await Admin.findOne({ email, _id: { $ne: req.user._id } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
  }

  const admin = await Admin.findById(req.user._id);
  if (name !== undefined) admin.name = name;
  if (email !== undefined) admin.email = email;
  if (phone !== undefined) admin.phone = phone;
  if (profileImage !== undefined) admin.profileImage = profileImage;
  await admin.save();

  res.json({ admin: admin.toSafeObject() });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  const admin = await Admin.findById(req.user._id).select('+password');
  if (!(await admin.comparePassword(currentPassword))) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  admin.password = newPassword;
  await admin.save();
  res.json({ message: 'Password updated successfully' });
});
