const Transporter = require('../models/Transporter');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const transporters = await Transporter.find(filter).sort({ createdAt: -1 });
  res.json({ transporters });
});

exports.getById = asyncHandler(async (req, res) => {
  const transporter = await Transporter.findById(req.params.id);
  if (!transporter) return res.status(404).json({ message: 'Transporter not found' });
  res.json({ transporter });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected', 'suspended', 'archived'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const transporter = await Transporter.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!transporter) return res.status(404).json({ message: 'Transporter not found' });
  res.json({ transporter });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { businessName, vehicleTypes, serviceArea, name, email } = req.body;
  const transporter = await Transporter.findByIdAndUpdate(
    req.user._id,
    { businessName, vehicleTypes, serviceArea, name, email },
    { new: true }
  );
  res.json({ transporter });
});
