const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store.controller');
const commerce = require('../controllers/storeCommerce.controller');
const reviewController = require('../controllers/review.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const optionalAuth = require('../middleware/optionalAuth.middleware');

router.get('/categories', storeController.listCategories);
router.post('/categories', protect, authorize('admin', 'store-seller'), storeController.createCategory);
router.put('/categories/:id', protect, authorize('admin', 'store-seller'), storeController.updateCategory);
router.delete('/categories/:id', protect, authorize('admin', 'store-seller'), storeController.removeCategory);

router.get('/products', optionalAuth, commerce.listProducts);
router.get('/products/:id', optionalAuth, storeController.getProduct);
router.get('/products/:id/related', commerce.relatedProducts);
router.post('/products', protect, authorize('store-seller'), storeController.createProduct);
router.put('/products/:id', protect, authorize('store-seller', 'admin'), storeController.updateProduct);
router.delete('/products/:id', protect, authorize('store-seller', 'admin'), storeController.removeProduct);

router.get('/favourites', protect, authorize('user'), commerce.listFavouriteProducts);
router.post('/favourites/:productId/toggle', protect, authorize('user'), commerce.toggleFavouriteProduct);

router.get('/sellers', protect, authorize('admin'), storeController.listSellers);
router.patch('/sellers/me', protect, authorize('store-seller'), storeController.updateMyProfile);

router.get('/orders', protect, authorize('store-seller', 'admin', 'user'), storeController.listOrders);
router.get('/orders/:id', protect, authorize('store-seller', 'admin', 'user'), commerce.getOrder);
router.get('/orders/:id/invoice', protect, authorize('store-seller', 'admin', 'user'), commerce.invoice);
router.post('/orders', protect, authorize('user'), commerce.createOrder);
router.patch('/orders/:id/status', protect, authorize('store-seller', 'admin'), commerce.updateOrderStatus);

router.post('/payments/razorpay-order', protect, authorize('user'), commerce.createPaymentOrder);
router.post('/cart/preview', protect, authorize('user'), commerce.previewCart);
router.get('/payment-options', commerce.paymentOptions);
router.get('/tax', commerce.taxSettings);
router.put('/tax', protect, authorize('admin'), commerce.updateTaxSettings);
router.put('/payment-options', protect, authorize('admin'), commerce.updatePaymentOptions);

router.get('/coupons', protect, authorize('admin'), commerce.listCoupons);
router.post('/coupons', protect, authorize('admin'), commerce.createCoupon);
router.put('/coupons/:id', protect, authorize('admin'), commerce.updateCoupon);
router.delete('/coupons/:id', protect, authorize('admin'), commerce.deleteCoupon);

router.get('/reviews', reviewController.listForProduct);
router.get('/reviews/mine', protect, authorize('store-seller'), reviewController.listMine);
router.post('/reviews', protect, authorize('user'), reviewController.create);

module.exports = router;
