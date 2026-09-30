const express = require('express');
const router = express.Router();
const archivedAccountController = require('../controllers/archivedAccount.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));

router.get('/', archivedAccountController.list);
router.patch('/:id/restore', archivedAccountController.restore);

module.exports = router;
