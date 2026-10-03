const express = require('express');
const router = express.Router();
const exploreController = require('../controllers/explore.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', exploreController.listActive);
router.get('/admin', protect, authorize('admin'), exploreController.listAll);
router.put('/:key', protect, authorize('admin'), exploreController.update);

module.exports = router;
