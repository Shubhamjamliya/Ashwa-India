const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const Order = require('../models/Order');
const StoreSeller = require('../models/StoreSeller');
const PaymentIntent = require('../models/PaymentIntent');
const asyncHandler = require('../utils/asyncHandler');
const { createRazorpayOrder, verifyPaymentSignature } = require('../utils/razorpay');
const pushService = require('../services/push.service');
const paymentService = require('../services/payment.service');
<<<<<<< HEAD
=======

async function validateCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('At least one item is required');
    err.status = 400;
    throw err;
  }
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, status: 'active' });
  if (products.length !== productIds.length) {
    const err = new Error('One or more products are unavailable');
    err.status = 400;
    throw err;
  }
  const total = items.reduce((sum, i) => {
    const product = products.find((p) => String(p._id) === String(i.productId));
    const quantity = Math.max(1, Number(i.quantity) || 1);
    return sum + product.price * quantity;
  }, 0);
  return { products, total };
}

exports.listProducts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.role === 'store-seller') {
    filter.seller = req.user._id;
  } else if (req.role !== 'admin') {
    filter.status = 'active';
  }
  if (req.query.status && req.role === 'admin') filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const products = await Product.find(filter)
    .populate('seller', 'name businessName phone')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 });
  res.json({ products });
});
>>>>>>> 9b7361865f039f7f9c120afae6d02753b2c7e89d

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('seller', 'name businessName phone')
    .populate('category', 'name slug');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, seller: req.user._id });
  res.status(201).json({ product });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (req.role === 'store-seller' && String(product.seller) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your product' });
  }
  Object.assign(product, req.body);
  await product.save();
  res.json({ product });
});

exports.removeProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (req.role === 'store-seller' && String(product.seller) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your product' });
  }
  await product.deleteOne();
  res.json({ message: 'Product removed' });
});

exports.listSellers = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const sellers = await StoreSeller.find(filter).sort({ createdAt: -1 });
  res.json({ sellers });
});

exports.updateSellerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected', 'suspended', 'archived'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const seller = await StoreSeller.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!seller) return res.status(404).json({ message: 'Seller not found' });
  res.json({ seller });
});

// PATCH /api/store/sellers/me — a store-seller editing their own profile.
exports.updateMyProfile = asyncHandler(async (req, res) => {
  const { name, email, businessName, logo } = req.body;
  const seller = await StoreSeller.findByIdAndUpdate(
    req.user._id,
    { name, email, businessName, logo },
    { new: true, omitUndefined: true }
  );
  res.json({ seller: seller.toSafeObject() });
});

// POST /api/store/payments/razorpay-order — creates a PaymentIntent + a
// Razorpay order for the given cart items. The intent is the thing the rest
// of checkout keys off of; the Razorpay order is just how it gets collected.
<<<<<<< HEAD
=======
exports.createPaymentOrder = asyncHandler(async (req, res) => {
  const { items, idempotencyKey } = req.body;
  const { total } = await validateCartItems(items);
  if (total <= 0) {
    return res.status(400).json({ message: 'Order total must be greater than zero' });
  }

  const intent = await paymentService.createIntent({
    idempotencyKey,
    payerType: 'user',
    payerId: req.user._id,
    purpose: 'store-order',
    amount: total,
    method: 'razorpay',
  });

  if (intent.razorpay?.orderId) {
    // Same idempotency key as an in-flight attempt — hand back the same order.
    return res.json({
      paymentIntentId: intent._id,
      razorpayOrderId: intent.razorpay.orderId,
      amount: Math.round(intent.amount * 100),
      currency: intent.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  }

  const razorpayOrder = await createRazorpayOrder({
    amount: total,
    receipt: `user_${req.user._id}_${Date.now()}`,
    notes: { buyerId: String(req.user._id), paymentIntentId: String(intent._id) },
  });

  await paymentService.markIntentPendingRazorpay(intent._id, razorpayOrder.id);

  res.json({
    paymentIntentId: intent._id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentIntentId, razorpayPaymentId, razorpaySignature, method } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'At least one item is required' });
  }

  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, status: 'active' });
  if (products.length !== productIds.length) {
    return res.status(400).json({ message: 'One or more products are unavailable' });
  }

  const sellerId = products[0].seller;
  if (!products.every((p) => String(p.seller) === String(sellerId))) {
    return res.status(400).json({ message: 'All items in one order must be from the same seller' });
  }

  const orderItems = items.map((i) => {
    const product = products.find((p) => String(p._id) === String(i.productId));
    const quantity = Math.max(1, Number(i.quantity) || 1);
    return { product: product._id, quantity, price: product.price };
  });
  const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  let intent;
  if (method === 'wallet') {
    intent = await paymentService.createIntent({
      payerType: 'user',
      payerId: req.user._id,
      purpose: 'store-order',
      amount: total,
      method: 'wallet',
    });
    try {
      await paymentService.payIntentFromWallet(intent._id, 'user', req.user._id);
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message });
    }
  } else {
    if (!paymentIntentId) return res.status(400).json({ message: 'paymentIntentId is required' });
    intent = await PaymentIntent.findById(paymentIntentId);
    if (!intent) return res.status(404).json({ message: 'Payment not found' });
    if (String(intent.payerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your payment' });
    }
    if (intent.status !== 'paid') {
      const valid = verifyPaymentSignature({
        razorpayOrderId: intent.razorpay?.orderId,
        razorpayPaymentId,
        razorpaySignature,
      });
      if (!valid) return res.status(400).json({ message: 'Payment verification failed' });
      intent = await paymentService.markIntentPaid(intent._id, { razorpayPaymentId, razorpaySignature });
    }
  }

  const order = await Order.create({
    buyer: req.user._id,
    seller: sellerId,
    items: orderItems,
    total,
    status: 'pending',
    paymentIntent: intent._id,
    shippingAddress: shippingAddress || undefined,
  });
  await paymentService.attachReference(intent._id, 'Order', order._id);

  await Promise.all(
    orderItems.map((i) => Product.findByIdAndUpdate(i.product, { $inc: { stock: -i.quantity } }))
  );

  const io = req.app.get('io');
  if (io) {
    const populatedOrder = await Order.findById(order._id)
      .populate('buyer', 'name phone')
      .populate('items.product', 'name price')
      .populate('paymentIntent');
    io.to(`seller:${sellerId}`).emit('order:new', populatedOrder);
  }
  pushService.sendPushToAccount('store-seller', sellerId, {
    title: 'New order received',
    body: `You have a new order worth ₹${total}`,
    data: { type: 'order:new', orderId: String(order._id) },
  }).catch(() => {});

  await order.populate('paymentIntent');
  res.status(201).json({ order });
});

>>>>>>> 9b7361865f039f7f9c120afae6d02753b2c7e89d
exports.listOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.role === 'store-seller') filter.seller = req.user._id;
  if (req.role === 'user') filter.buyer = req.user._id;
  const orders = await Order.find(filter)
    .populate('buyer', 'name phone')
    .populate('seller', 'name businessName phone')
    .populate('items.product', 'name price')
    .populate('paymentIntent')
    .sort({ createdAt: -1 });
  res.json({ orders });
});

<<<<<<< HEAD
=======
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (req.role === 'store-seller' && String(order.seller) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your order' });
  }

  const wasActive = !['cancelled', 'returned'].includes(order.status);
  const nowInactive = ['cancelled', 'returned'].includes(status);
  if (wasActive && nowInactive) {
    await Promise.all(
      order.items.map((i) => Product.findByIdAndUpdate(i.product, { $inc: { stock: i.quantity } }))
    );
  }

  order.status = status;
  await order.save();

  // Credit the seller's wallet once the order is actually delivered — guarded
  // by payoutCompletedAt so a status flip-flop can't pay out twice.
  if (status === 'delivered' && !order.payoutCompletedAt) {
    await paymentService.payout('store-seller', order.seller, order.total, {
      paymentIntentId: order.paymentIntent,
      description: `Payout for order ${order._id}`,
    });
    order.payoutCompletedAt = new Date();
    await order.save();
  }

  await order.populate('paymentIntent');
  res.json({ order });
});

>>>>>>> 9b7361865f039f7f9c120afae6d02753b2c7e89d
// ---- Product categories (admin and store-sellers manage, everyone can read) ----

exports.listCategories = asyncHandler(async (req, res) => {
  const categories = await ProductCategory.find().sort({ name: 1 });
  res.json({ categories });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await ProductCategory.create(req.body);
  res.status(201).json({ category });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await ProductCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ category });
});

exports.removeCategory = asyncHandler(async (req, res) => {
  const category = await ProductCategory.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ message: 'Category removed' });
});
