const express = require('express');
const router = express.Router();
const brandingController = require('../controllers/branding.controller');

router.get('/', brandingController.getPublicBranding);

module.exports = router;
