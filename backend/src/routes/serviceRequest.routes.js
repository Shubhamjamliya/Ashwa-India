const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequest.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/providers', protect, authorize('user'), serviceRequestController.listProvidersForService);
router.get('/providers/:id', protect, authorize('user'), serviceRequestController.getProviderProfile);
router.post('/requests', protect, authorize('user'), serviceRequestController.createRequest);
router.get('/requests/mine', protect, authorize('user'), serviceRequestController.listMine);
router.post('/requests/:id/review', protect, authorize('user'), serviceRequestController.createReview);

router.get('/requests/incoming', protect, authorize('provider'), serviceRequestController.listIncoming);
router.patch('/requests/:id/respond', protect, authorize('provider'), serviceRequestController.respond);
router.get('/reviews/mine', protect, authorize('provider'), serviceRequestController.listMyReviews);

module.exports = router;
