const Provider = require('../models/Provider');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const providers = await Provider.find(filter).sort({ createdAt: -1 });
  res.json({ providers });
});

exports.getById = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) return res.status(404).json({ message: 'Provider not found' });
  res.json({ provider });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected', 'suspended', 'archived'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const provider = await Provider.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!provider) return res.status(404).json({ message: 'Provider not found' });
  res.json({ provider });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { businessName, serviceTypes, location, name, email } = req.body;
  const provider = await Provider.findByIdAndUpdate(
    req.user._id,
    { businessName, serviceTypes, location, name, email },
    { new: true }
  );
  res.json({ provider });
});
