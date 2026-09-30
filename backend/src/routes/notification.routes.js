const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));

router.get('/broadcast', notificationController.list);
router.post('/broadcast', notificationController.broadcast);

module.exports = router;
