const Admin = require('../models/Admin');
const User = require('../models/User');
const HorseSeller = require('../models/HorseSeller');
const StoreSeller = require('../models/StoreSeller');
const Provider = require('../models/Provider');
const Transporter = require('../models/Transporter');

// Roles that authenticate via phone + OTP (everyone except admin).
const otpRoles = {
  user: User,
  'horse-seller': HorseSeller,
  'store-seller': StoreSeller,
  provider: Provider,
  transporter: Transporter,
};

const allRoles = { admin: Admin, ...otpRoles };

module.exports = { allRoles, otpRoles };
