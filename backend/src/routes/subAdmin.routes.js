const express = require('express');
const router = express.Router();
const subAdminController = require('../controllers/subAdmin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));

router.get('/', subAdminController.list);
router.post('/', subAdminController.create);
router.delete('/:id', subAdminController.remove);

module.exports = router;
