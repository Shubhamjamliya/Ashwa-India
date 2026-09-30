const { otpRoles } = require('../utils/roleModel');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const results = await Promise.all(
    Object.entries(otpRoles).map(async ([role, Model]) => {
      const accounts = await Model.find({ status: 'archived' }).sort({ updatedAt: -1 });
      return accounts.map((a) => ({ ...a.toObject(), role }));
    })
  );

  const accounts = results.flat().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ accounts });
});

exports.restore = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const Model = otpRoles[role];
  if (!Model) return res.status(400).json({ message: `role must be one of: ${Object.keys(otpRoles).join(', ')}` });

  const newStatus = role === 'user' ? 'active' : 'approved';
  const account = await Model.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true });
  if (!account) return res.status(404).json({ message: 'Account not found' });
  res.json({ account });
});
