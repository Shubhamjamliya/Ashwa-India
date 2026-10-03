const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequest.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/requests', protect, authorize('user'), serviceRequestController.createRequest);
router.get('/requests/mine', protect, authorize('user'), serviceRequestController.listMine);

router.get('/requests/incoming', protect, authorize('provider'), serviceRequestController.listIncoming);
router.patch('/requests/:id/respond', protect, authorize('provider'), serviceRequestController.respond);

module.exports = router;
