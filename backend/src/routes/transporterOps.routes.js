const express = require('express');
const router = express.Router();
const ops = require('../controllers/transporterOps.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Transporter: KYC, fleet, drivers, withdrawals, reviews, alerts
router.get('/kyc', protect, authorize('transporter'), ops.getKyc);
router.put('/kyc', protect, authorize('transporter'), ops.submitKyc);
router.get('/dashboard', protect, authorize('transporter'), ops.dashboard);
router.get('/alerts', protect, authorize('transporter'), ops.expiryAlerts);
router.get('/vehicle-types', protect, authorize('transporter'), ops.vehicleTypes);

router.get('/vehicles', protect, authorize('transporter'), ops.listVehicles);
router.post('/vehicles', protect, authorize('transporter'), ops.createVehicle);
router.patch('/vehicles/:id', protect, authorize('transporter'), ops.updateVehicle);
router.delete('/vehicles/:id', protect, authorize('transporter'), ops.deleteVehicle);

router.get('/drivers', protect, authorize('transporter'), ops.listDrivers);
router.post('/drivers', protect, authorize('transporter'), ops.createDriver);
router.patch('/drivers/:id', protect, authorize('transporter'), ops.updateDriver);
router.delete('/drivers/:id', protect, authorize('transporter'), ops.deleteDriver);

router.post('/withdrawals', protect, authorize('transporter'), ops.requestWithdrawal);
router.get('/withdrawals/mine', protect, authorize('transporter'), ops.myWithdrawals);
router.get('/reviews/mine', protect, authorize('transporter'), ops.myReviews);

// Admin
router.get('/admin/withdrawals', protect, authorize('admin'), ops.listWithdrawals);
router.patch('/admin/withdrawals/:id', protect, authorize('admin'), ops.decideWithdrawal);
router.patch('/admin/kyc/:transporterId', protect, authorize('admin'), ops.decideKyc);
router.patch('/admin/transporters/:transporterId/controls', protect, authorize('admin'), ops.updateControls);
router.get('/admin/transporters/:transporterId/fleet', protect, authorize('admin'), ops.adminFleet);
router.get('/admin/live-trips', protect, authorize('admin'), ops.liveTrips);
router.get('/admin/reports', protect, authorize('admin'), ops.reports);

module.exports = router;
