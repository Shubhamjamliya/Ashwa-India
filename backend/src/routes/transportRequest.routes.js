const express = require('express');
const router = express.Router();
const transportRequestController = require('../controllers/transportRequest.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/available', protect, authorize('user'), transportRequestController.listAvailable);

router.post('/requests', protect, authorize('user'), transportRequestController.createRequest);
router.get('/requests/mine', protect, authorize('user'), transportRequestController.listMine);

router.get('/requests/incoming', protect, authorize('transporter'), transportRequestController.listIncoming);
router.get('/requests/:id', protect, authorize('transporter'), transportRequestController.getDetail);
router.patch('/requests/:id/respond', protect, authorize('transporter'), transportRequestController.respond);
router.patch('/requests/:id/stage', protect, authorize('transporter'), transportRequestController.advanceStage);
router.post('/requests/:id/location', protect, authorize('transporter'), transportRequestController.updateLocation);

router.get('/requests', protect, authorize('admin'), transportRequestController.listAll);
router.patch('/requests/:id/cancel', protect, authorize('admin'), transportRequestController.cancel);

module.exports = router;
