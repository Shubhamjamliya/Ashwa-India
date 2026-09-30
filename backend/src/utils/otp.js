const crypto = require('crypto');
const Otp = require('../models/Otp');
const { sendOtpSms } = require('./sms');

const USE_DEFAULT_OTP = process.env.USE_DEFAULT_OTP === 'true';
const DEFAULT_OTP = '123456';

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999));
}

async function requestOtp(phone) {
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length !== 10) {
    const err = new Error('A valid 10-digit phone number is required');
    err.status = 400;
    throw err;
  }

  const now = new Date();
  const existing = await Otp.findOne({ phone: normalizedPhone });

  if (existing?.blockedUntil && existing.blockedUntil > now) {
    const mins = Math.ceil((existing.blockedUntil - now) / 60000);
    const err = new Error(`Too many failed attempts. Try again in ${mins} minute(s).`);
    err.status = 429;
    throw err;
  }

  const rateWindowMs = Number(process.env.OTP_RATE_WINDOW || 600) * 1000;
  const rateLimit = Number(process.env.OTP_RATE_LIMIT || 3);
  let requestCount = 1;
  if (existing && now - existing.lastRequestAt < rateWindowMs) {
    if (!USE_DEFAULT_OTP && existing.requestCount >= rateLimit) {
      const err = new Error('Too many OTP requests. Please try again later.');
      err.status = 429;
      throw err;
    }
    requestCount = existing.requestCount + 1;
  }

  const otp = USE_DEFAULT_OTP ? DEFAULT_OTP : generateOtpCode();
  const ttlMs = Number(process.env.OTP_EXPIRY_SECONDS || 300) * 1000;
  const otpExpiresAt = new Date(now.getTime() + ttlMs);
  const expiresAt = new Date(now.getTime() + Math.max(3600000, ttlMs));

  await Otp.findOneAndUpdate(
    { phone: normalizedPhone },
    { otp, otpExpiresAt, expiresAt, attempts: 0, requestCount, lastRequestAt: now },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (USE_DEFAULT_OTP) {
    console.log(`[OTP] Default OTP mode — OTP for ${normalizedPhone} is ${otp}`);
  } else {
    await sendOtpSms(normalizedPhone, otp);
  }

  return { phone: normalizedPhone, devOtp: USE_DEFAULT_OTP ? otp : undefined };
}

async function verifyOtp(phone, code) {
  const normalizedPhone = normalizePhone(phone);
  const record = await Otp.findOne({ phone: normalizedPhone });
  const now = new Date();

  if (USE_DEFAULT_OTP && code === DEFAULT_OTP) {
    if (record) await record.deleteOne();
    return { valid: true, phone: normalizedPhone };
  }

  if (!record) return { valid: false, reason: 'OTP not found. Please request a new OTP.' };

  if (record.blockedUntil && record.blockedUntil > now) {
    const mins = Math.ceil((record.blockedUntil - now) / 60000);
    return { valid: false, reason: `Too many attempts. Try again in ${mins} minute(s).` };
  }

  record.attempts += 1;
  const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS || 3);

  if (record.attempts >= maxAttempts) {
    record.totalFailures += 1;
    const penaltyMinutes = record.totalFailures === 1 ? 1 : 10;
    record.blockedUntil = new Date(now.getTime() + penaltyMinutes * 60000);
    record.attempts = 0;
    await record.save();
    return { valid: false, reason: `Too many attempts. Blocked for ${penaltyMinutes} minute(s).` };
  }

  if (record.otpExpiresAt < now) {
    await record.save();
    return { valid: false, reason: 'OTP expired. Please request a new one.' };
  }

  if (record.otp !== code) {
    await record.save();
    return { valid: false, reason: 'Invalid OTP' };
  }

  await record.deleteOne();
  return { valid: true, phone: normalizedPhone };
}

module.exports = { requestOtp, verifyOtp, normalizePhone };
