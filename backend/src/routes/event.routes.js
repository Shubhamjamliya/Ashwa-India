const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', eventController.listPublic);
router.get('/admin', protect, authorize('admin'), eventController.listAll);
router.post('/', protect, authorize('admin'), eventController.create);
router.put('/:id', protect, authorize('admin'), eventController.update);
router.delete('/:id', protect, authorize('admin'), eventController.remove);

module.exports = router;
