const express = require('express');
const router = express.Router();
const transportRequestController = require('../controllers/transportRequest.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/available', protect, authorize('user'), transportRequestController.listAvailable);

router.post('/requests', protect, authorize('user'), transportRequestController.createRequest);
router.get('/requests/mine', protect, authorize('user'), transportRequestController.listMine);

router.get('/requests/incoming', protect, authorize('transporter'), transportRequestController.listIncoming);
router.patch('/requests/:id/respond', protect, authorize('transporter'), transportRequestController.respond);

module.exports = router;
