const CmsPage = require('../models/CmsPage');
const asyncHandler = require('../utils/asyncHandler');

const validKeys = ['about', 'contact', 'terms', 'privacy', 'support', 'refund', 'shipping', 'cancellation'];

exports.getByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  if (!validKeys.includes(key)) return res.status(400).json({ message: 'Invalid page key' });

  const page = await CmsPage.findOne({ key });
  res.json({ page: page || { key, title: '', content: '' } });
});

exports.upsertByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  if (!validKeys.includes(key)) return res.status(400).json({ message: 'Invalid page key' });

  const page = await CmsPage.findOneAndUpdate(
    { key },
    { ...req.body, key, updatedBy: req.user._id },
    { new: true, upsert: true }
  );
  res.json({ page });
});
