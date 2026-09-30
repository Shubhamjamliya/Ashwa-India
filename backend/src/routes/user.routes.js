const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));

router.get('/', userController.list);
router.get('/:id', userController.getById);
router.patch('/:id/status', userController.updateStatus);

module.exports = router;
