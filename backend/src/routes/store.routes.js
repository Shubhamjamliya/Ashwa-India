const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const optionalAuth = require('../middleware/optionalAuth.middleware');

router.get('/categories', storeController.listCategories);
router.post('/categories', protect, authorize('admin', 'store-seller'), storeController.createCategory);
router.put('/categories/:id', protect, authorize('admin', 'store-seller'), storeController.updateCategory);
router.delete('/categories/:id', protect, authorize('admin', 'store-seller'), storeController.removeCategory);

router.get('/products', optionalAuth, storeController.listProducts);
router.get('/products/:id', optionalAuth, storeController.getProduct);
router.post('/products', protect, authorize('store-seller'), storeController.createProduct);
router.put('/products/:id', protect, authorize('store-seller', 'admin'), storeController.updateProduct);
router.delete('/products/:id', protect, authorize('store-seller', 'admin'), storeController.removeProduct);

router.get('/sellers', protect, authorize('admin'), storeController.listSellers);
router.patch('/sellers/:id/status', protect, authorize('admin'), storeController.updateSellerStatus);

router.get('/orders', protect, authorize('store-seller', 'admin', 'user'), storeController.listOrders);
router.post('/orders', protect, authorize('user'), storeController.createOrder);
router.post('/payments/razorpay-order', protect, authorize('user'), storeController.createPaymentOrder);
router.patch('/orders/:id/status', protect, authorize('store-seller', 'admin'), storeController.updateOrderStatus);

module.exports = router;
