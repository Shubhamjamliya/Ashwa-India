const jwt = require('jsonwebtoken');
const { allRoles } = require('../utils/roleModel');
const asyncHandler = require('../utils/asyncHandler');

exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const token = header.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  const Model = allRoles[decoded.role];
  if (!Model) return res.status(401).json({ message: 'Not authenticated' });

  const account = await Model.findById(decoded.id);
  if (!account || ['suspended', 'archived', 'rejected'].includes(account.status)) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  req.user = account;
  req.role = decoded.role;
  next();
});

exports.authorize = (...roles) => (req, res, next) => {
  if (!req.role || !roles.includes(req.role)) {
    return res.status(403).json({ message: 'Not authorized for this action' });
  }
  next();
};
