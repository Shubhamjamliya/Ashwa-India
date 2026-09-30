const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const optionalAuth = require('../middleware/optionalAuth.middleware');

router.get('/categories', storeController.listCategories);
router.post('/categories', protect, authorize('admin'), storeController.createCategory);
router.put('/categories/:id', protect, authorize('admin'), storeController.updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), storeController.removeCategory);

router.get('/subcategories', storeController.listSubCategories);
router.post('/subcategories', protect, authorize('admin'), storeController.createSubCategory);
router.put('/subcategories/:id', protect, authorize('admin'), storeController.updateSubCategory);
router.delete('/subcategories/:id', protect, authorize('admin'), storeController.removeSubCategory);

router.get('/products', optionalAuth, storeController.listProducts);
router.get('/products/:id', optionalAuth, storeController.getProduct);
router.post('/products', protect, authorize('store-seller'), storeController.createProduct);
router.put('/products/:id', protect, authorize('store-seller', 'admin'), storeController.updateProduct);
router.delete('/products/:id', protect, authorize('store-seller', 'admin'), storeController.removeProduct);

router.get('/sellers', protect, authorize('admin'), storeController.listSellers);
router.patch('/sellers/:id/status', protect, authorize('admin'), storeController.updateSellerStatus);

router.get('/orders', protect, authorize('store-seller', 'admin'), storeController.listOrders);
router.patch('/orders/:id/status', protect, authorize('store-seller', 'admin'), storeController.updateOrderStatus);

module.exports = router;
