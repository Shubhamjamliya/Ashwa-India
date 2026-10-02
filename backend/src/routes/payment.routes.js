const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const WALLET_ROLES = ['user', 'transporter', 'provider', 'store-seller', 'horse-seller'];

router.get('/wallet', protect, authorize(...WALLET_ROLES), paymentController.getMyWallet);
router.get('/wallet/transactions', protect, authorize(...WALLET_ROLES), paymentController.getMyWalletTransactions);
router.post('/wallet/topup/razorpay-order', protect, authorize(...WALLET_ROLES), paymentController.createTopupOrder);
router.post('/wallet/topup/verify', protect, authorize(...WALLET_ROLES), paymentController.verifyTopup);

module.exports = router;
