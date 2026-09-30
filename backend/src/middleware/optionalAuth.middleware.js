const jwt = require('jsonwebtoken');
const { allRoles } = require('../utils/roleModel');
const asyncHandler = require('../utils/asyncHandler');

// Attaches req.user/req.role if a valid token is present, but never blocks the request.
module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_ACCESS_SECRET);
      const Model = allRoles[decoded.role];
      if (Model) {
        req.user = await Model.findById(decoded.id);
        req.role = decoded.role;
      }
    } catch (err) {
      req.user = null;
      req.role = null;
    }
  }
  next();
});
