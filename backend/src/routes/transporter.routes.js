const express = require('express');
const router = express.Router();
const transporterController = require('../controllers/transporter.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.patch('/me', protect, authorize('transporter'), transporterController.updateProfile);
router.patch('/me/availability', protect, authorize('transporter'), transporterController.updateAvailability);

router.use(protect, authorize('admin'));
router.get('/', transporterController.list);
router.get('/:id', transporterController.getById);
router.patch('/:id/status', transporterController.updateStatus);

module.exports = router;
