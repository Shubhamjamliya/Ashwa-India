const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplace.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const optionalAuth = require('../middleware/optionalAuth.middleware');

router.get('/categories', optionalAuth, marketplaceController.listCategories);
router.post('/categories', protect, authorize('admin', 'horse-seller'), marketplaceController.createCategory);
router.put('/categories/:id', protect, authorize('admin', 'horse-seller'), marketplaceController.updateCategory);
router.delete('/categories/:id', protect, authorize('admin', 'horse-seller'), marketplaceController.removeCategory);
router.patch('/categories/:id/approve', protect, authorize('admin'), marketplaceController.approveCategory);
router.patch('/categories/:id/reject', protect, authorize('admin'), marketplaceController.rejectCategory);
router.patch('/categories/:id/make-global', protect, authorize('admin'), marketplaceController.makeCategoryGlobal);

router.get('/horses', optionalAuth, marketplaceController.list);
router.get('/horses/:id', optionalAuth, marketplaceController.getById);
router.post('/horses', protect, authorize('horse-seller'), marketplaceController.create);
router.put('/horses/:id', protect, authorize('horse-seller', 'admin'), marketplaceController.update);
router.delete('/horses/:id', protect, authorize('horse-seller', 'admin'), marketplaceController.remove);

router.get('/sellers', protect, authorize('admin'), marketplaceController.listSellers);
router.patch('/sellers/:id/status', protect, authorize('admin'), marketplaceController.updateSellerStatus);

router.get('/inquiries', protect, authorize('horse-seller', 'admin'), marketplaceController.listInquiries);
router.post('/inquiries', protect, authorize('user'), marketplaceController.createInquiry);

const engagement = require('../controllers/marketplaceEngagement.controller');

router.get('/inquiries/mine', protect, authorize('user'), engagement.listMyInquiries);
router.get('/inquiries/:id', protect, authorize('user', 'horse-seller'), engagement.getThread);
router.post('/inquiries/:id/messages', protect, authorize('user', 'horse-seller'), engagement.postMessage);

router.post('/visits', protect, authorize('user'), engagement.createVisit);
router.get('/visits/mine', protect, authorize('user'), engagement.listMyVisits);
router.get('/visits', protect, authorize('horse-seller'), engagement.listSellerVisits);
router.patch('/visits/:id', protect, authorize('horse-seller'), engagement.respondVisit);

router.get('/favourites', protect, authorize('user'), engagement.listFavourites);
router.post('/favourites/:horseId/toggle', protect, authorize('user'), engagement.toggleFavourite);

module.exports = router;
