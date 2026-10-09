const express = require('express');
const router = express.Router();
const vehicleType = require('../controllers/vehicleType.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', vehicleType.listActive);
router.get('/admin', protect, authorize('admin'), vehicleType.listAll);
router.post('/', protect, authorize('admin'), vehicleType.create);
router.put('/:id', protect, authorize('admin'), vehicleType.update);
router.delete('/:id', protect, authorize('admin'), vehicleType.remove);

module.exports = router;
