const express = require('express');
const router = express.Router();
const transportRequestController = require('../controllers/transportRequest.controller');
const trip = require('../controllers/transportTrip.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/available', protect, authorize('user'), transportRequestController.listAvailable);

router.post('/advance/razorpay-order', protect, authorize('user'), transportRequestController.createAdvanceOrder);
router.post('/requests', protect, authorize('user'), transportRequestController.createRequest);
router.get('/requests/mine', protect, authorize('user'), transportRequestController.listMine);
router.get('/requests/mine/:id', protect, authorize('user'), transportRequestController.getMine);
router.patch('/requests/:id/cancel-mine', protect, authorize('user'), transportRequestController.cancelMine);
router.patch('/requests/:id/share-consent', protect, authorize('user'), transportRequestController.shareConsent);
router.post('/requests/:id/review', protect, authorize('user'), trip.reviewTrip);

router.get('/requests/incoming', protect, authorize('transporter'), transportRequestController.listIncoming);
router.get('/requests/:id', protect, authorize('transporter'), transportRequestController.getDetail);
router.patch('/requests/:id/respond', protect, authorize('transporter'), transportRequestController.respond);
router.patch('/requests/:id/stage', protect, authorize('transporter'), transportRequestController.advanceStage);
router.post('/requests/:id/location', protect, authorize('transporter'), transportRequestController.updateLocation);
router.patch('/requests/:id/assign', protect, authorize('transporter'), trip.assign);
router.patch('/requests/:id/schedule', protect, authorize('transporter'), trip.schedulePickup);
router.patch('/requests/:id/pause', protect, authorize('transporter'), trip.pauseTrip);
router.post('/requests/:id/proof', protect, authorize('transporter'), trip.uploadProof);

router.get('/requests', protect, authorize('admin'), transportRequestController.listAll);
router.patch('/requests/:id/cancel', protect, authorize('admin'), transportRequestController.cancel);

module.exports = router;
