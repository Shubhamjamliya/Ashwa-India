const express = require('express');
const router = express.Router();
const providerController = require('../controllers/provider.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.patch('/me', protect, authorize('provider'), providerController.updateProfile);
router.patch('/me/availability', protect, authorize('provider'), providerController.updateAvailability);

router.use(protect, authorize('admin'));
router.get('/', providerController.list);
router.get('/:id', providerController.getById);
router.patch('/:id/status', providerController.updateStatus);

module.exports = router;
