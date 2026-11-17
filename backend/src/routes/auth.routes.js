const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Admin: email + password
router.post('/admin/login', authController.adminLogin);

// Everyone else: phone + OTP
router.post('/otp/request', authController.requestOtp);
router.post('/otp/verify', authController.verifyOtp);
router.post('/register', authController.register);

// Public provider sign-up form (no OTP). Creates a pending provider for admin approval.
router.post('/provider-join', authController.providerJoin);

router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.me);

module.exports = router;
