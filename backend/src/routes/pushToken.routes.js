const express = require('express');
const router = express.Router();
const pushTokenController = require('../controllers/pushToken.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/fcm-token', protect, pushTokenController.register);
router.delete('/fcm-token', protect, pushTokenController.unregister);

module.exports = router;
