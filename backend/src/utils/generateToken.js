const jwt = require('jsonwebtoken');

exports.generateAccessToken = function generateAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
};

exports.generateRefreshToken = function generateRefreshToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d',
  });
};

// Short-lived token proving a phone was OTP-verified, used to complete registration
// without re-sending/re-checking the OTP on submit.
exports.generateRegistrationToken = function generateRegistrationToken(phone, role) {
  return jwt.sign({ phone, role, purpose: 'register' }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
};
