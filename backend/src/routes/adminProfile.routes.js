const express = require('express');
const router = express.Router();
const adminProfileController = require('../controllers/adminProfile.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));

router.get('/', adminProfileController.getProfile);
router.put('/', adminProfileController.updateProfile);
router.put('/password', adminProfileController.changePassword);

module.exports = router;
