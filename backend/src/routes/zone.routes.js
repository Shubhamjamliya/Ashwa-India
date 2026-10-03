const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zone.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public — every app (user, transporter, provider) calls this before showing
// its main content, so no auth required.
router.get('/check', zoneController.checkPoint);
router.get('/active', zoneController.listActivePublic);

router.use(protect, authorize('admin'));
router.get('/', zoneController.list);
router.get('/:id', zoneController.getById);
router.post('/', zoneController.create);
router.patch('/:id', zoneController.update);
router.delete('/:id', zoneController.remove);

module.exports = router;
