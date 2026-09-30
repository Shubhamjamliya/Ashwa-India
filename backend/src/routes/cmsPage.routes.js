const express = require('express');
const router = express.Router();
const cmsPageController = require('../controllers/cmsPage.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public read (About/Terms/Privacy etc. are shown on the public site), admin-only write
router.get('/:key', cmsPageController.getByKey);
router.put('/:key', protect, authorize('admin'), cmsPageController.upsertByKey);

module.exports = router;
