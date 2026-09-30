const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
  res.json({ notifications });
});

exports.broadcast = asyncHandler(async (req, res) => {
  const { title, message, audience } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: 'title and message are required' });
  }
  const notification = await Notification.create({
    title,
    message,
    audience: audience || 'all',
    createdBy: req.user._id,
  });
  res.status(201).json({ notification });
});
