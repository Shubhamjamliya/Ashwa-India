const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/banner.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', bannerController.listActive);
router.get('/admin', protect, authorize('admin'), bannerController.listAll);
router.post('/', protect, authorize('admin'), bannerController.create);
router.put('/:id', protect, authorize('admin'), bannerController.update);
router.delete('/:id', protect, authorize('admin'), bannerController.remove);

module.exports = router;
