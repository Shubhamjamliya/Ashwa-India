const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { allRoles, otpRoles } = require('../utils/roleModel');
const { generateAccessToken, generateRefreshToken, generateRegistrationToken } = require('../utils/generateToken');
const { requestOtp: sendOtp, verifyOtp: checkOtp, normalizePhone } = require('../utils/otp');
const asyncHandler = require('../utils/asyncHandler');

function issueTokens(res, account, role, status) {
  const accessToken = generateAccessToken({ _id: account._id, role });
  const refreshToken = generateRefreshToken({ _id: account._id, role });
  res.status(status || 200).json({ accessToken, refreshToken, user: account.toSafeObject() });
}

function assertRole(role, res) {
  if (!role || !otpRoles[role]) {
    res.status(400).json({ message: `role must be one of: ${Object.keys(otpRoles).join(', ')}` });
    return false;
  }
  return true;
}

// ---- Admin: email + password ----

exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const admin = await Admin.findOne({ email }).select('+password');
  if (!admin || !(await admin.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (admin.status !== 'active') {
    return res.status(403).json({ message: 'This admin account is not active' });
  }

  issueTokens(res, admin, 'admin');
});

// ---- Everyone else: phone + OTP ----

// Step 1: request an OTP, and tell the frontend whether this phone already has
// an account for this role (so it knows whether to show the registration form next).
exports.requestOtp = asyncHandler(async (req, res) => {
  const { phone, role } = req.body;
  if (!assertRole(role, res)) return;

  const Model = otpRoles[role];
  const result = await sendOtp(phone);
  const exists = Boolean(await Model.findOne({ phone: result.phone }));

  res.json({ message: 'OTP sent', phone: result.phone, devOtp: result.devOtp, exists });
});

// Step 2: verify the OTP.
// - Existing account -> log them in directly (subject to approval status).
// - No account yet   -> issue a short-lived registrationToken for the registration form.
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp, role } = req.body;
  if (!assertRole(role, res)) return;

  const result = await checkOtp(phone, otp);
  if (!result.valid) {
    return res.status(400).json({ message: result.reason });
  }

  const Model = otpRoles[role];
  const account = await Model.findOne({ phone: result.phone });

  if (!account) {
    const registrationToken = generateRegistrationToken(result.phone, role);
    return res.json({ requiresRegistration: true, registrationToken });
  }

  if (role !== 'user' && account.status === 'pending') {
    return res.status(403).json({ message: 'Your account is pending admin approval' });
  }
  if (['rejected', 'suspended', 'archived'].includes(account.status)) {
    return res.status(403).json({ message: `This account is ${account.status}` });
  }

  issueTokens(res, account, role);
});

// Step 3 (new accounts only): submit registration details using the token from step 2.
exports.register = asyncHandler(async (req, res) => {
  const { registrationToken, name, email, businessName } = req.body;
  if (!registrationToken) return res.status(400).json({ message: 'registrationToken is required' });
  if (!name) return res.status(400).json({ message: 'name is required' });

  let decoded;
  try {
    decoded = jwt.verify(registrationToken, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Registration session expired. Please verify OTP again.' });
  }
  if (decoded.purpose !== 'register' || !otpRoles[decoded.role]) {
    return res.status(400).json({ message: 'Invalid registration token' });
  }

  const Model = otpRoles[decoded.role];
  const existing = await Model.findOne({ phone: decoded.phone });
  if (existing) {
    return res.status(409).json({ message: 'This phone number is already registered' });
  }

  // Consumers don't need approval; sellers/providers/transporters do.
  const status = decoded.role === 'user' ? 'active' : 'pending';
  const account = await Model.create({
    phone: decoded.phone,
    name,
    email,
    ...(businessName ? { businessName } : {}),
    status,
  });

  if (status === 'active') {
    return issueTokens(res, account, decoded.role, 201);
  }

  res.status(201).json({
    message: 'Registration submitted. Your account is pending admin approval.',
    status: 'pending',
  });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken is required' });

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }

  const Model = allRoles[decoded.role];
  if (!Model) return res.status(401).json({ message: 'Invalid token' });

  const account = await Model.findById(decoded.id);
  if (!account || ['suspended', 'archived', 'rejected'].includes(account.status)) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }

  issueTokens(res, account, decoded.role);
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

exports.logout = (req, res) => {
  res.json({ message: 'Logged out' });
};
