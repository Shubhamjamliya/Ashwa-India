const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

// Any authenticated actor (admin, seller, provider, transporter, user) can use this.
router.post('/image', protect, upload.single('file'), uploadController.uploadImage);

module.exports = router;
