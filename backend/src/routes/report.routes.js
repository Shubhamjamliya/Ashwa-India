const express = require('express');
const router = express.Router();
const reports = require('../controllers/report.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Admin reports: sales, transport, service, product, revenue, users. ?from=&to= filters by date.
router.get('/:type', protect, authorize('admin'), reports.report);

module.exports = router;
