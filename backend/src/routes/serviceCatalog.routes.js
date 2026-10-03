const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/serviceCatalog.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', catalogController.listActive);
router.get('/admin', protect, authorize('admin'), catalogController.listAll);
router.post('/', protect, authorize('admin'), catalogController.create);
router.put('/:id', protect, authorize('admin'), catalogController.update);
router.delete('/:id', protect, authorize('admin'), catalogController.remove);

module.exports = router;
