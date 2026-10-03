const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commission.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/rules', protect, authorize('admin'), commissionController.listRules);
router.put('/rules/:role', protect, authorize('admin'), commissionController.updateRule);
router.get('/summary', protect, authorize('admin'), commissionController.adminSummary);

router.get('/me', protect, authorize('transporter', 'provider'), commissionController.myEarnings);

module.exports = router;
