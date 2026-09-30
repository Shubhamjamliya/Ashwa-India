const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');

// "Sub-admins" are Admin documents with an accessLevel other than "Full Access".
exports.list = asyncHandler(async (req, res) => {
  const subAdmins = await Admin.find({ accessLevel: { $ne: 'Full Access' } }).sort({ createdAt: -1 });
  res.json({ subAdmins });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, accessLevel } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }
  const existing = await Admin.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const subAdmin = await Admin.create({
    name,
    email,
    password,
    accessLevel: accessLevel || 'Support Only',
  });
  res.status(201).json({ subAdmin: subAdmin.toSafeObject() });
});

exports.remove = asyncHandler(async (req, res) => {
  const subAdmin = await Admin.findOneAndDelete({ _id: req.params.id, accessLevel: { $ne: 'Full Access' } });
  if (!subAdmin) return res.status(404).json({ message: 'Sub-admin not found' });
  res.json({ message: 'Sub-admin removed' });
});
