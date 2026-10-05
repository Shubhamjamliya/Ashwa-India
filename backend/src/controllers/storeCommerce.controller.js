const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const PaymentIntent = require('../models/PaymentIntent');
const SystemSettings = require('../models/SystemSettings');
const asyncHandler = require('../utils/asyncHandler');
const { createRazorpayOrder, verifyPaymentSignature } = require('../utils/razorpay');
const pushService = require('../services/push.service');
const paymentService = require('../services/payment.service');
const { priceCart, decrementStock, restoreStock, fail } = require('../services/storeCart.service');
const commissionService = require('../services/commission.service');
const { buildInvoicePdf } = require('../utils/invoicePdf');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function codEnabled() {
  const settings = await SystemSettings.findOneAndUpdate(
    { key: 'singleton' },
    { $setOnInsert: { key: 'singleton' } },
    { upsert: true, new: true }
  );
  return Boolean(settings.payments?.codEnabled);
}

// GET /api/store/products — search and filters for the shop
exports.listProducts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.role === 'store-seller') {
    filter.seller = req.user._id;
  } else if (req.role !== 'admin') {
    filter.status = 'active';
  }
  if (req.query.status && req.role === 'admin') filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.q && String(req.query.q).trim()) {
    const pattern = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
    filter.$or = [{ name: pattern }, { description: pattern }];
  }
  const min = Number(req.query.minPrice);
  const max = Number(req.query.maxPrice);
  if (req.query.minPrice !== undefined && !Number.isNaN(min)) filter.price = { ...filter.price, $gte: min };
  if (req.query.maxPrice !== undefined && !Number.isNaN(max)) filter.price = { ...filter.price, $lte: max };
  if (req.query.inStock === '1') {
    filter.$and = [{ $or: [{ stock: { $gt: 0 } }, { 'variants.stock': { $gt: 0 } }] }];
  }

  const sorts = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { ratingAverage: -1, ratingCount: -1 },
    newest: { createdAt: -1 },
  };
  const products = await Product.find(filter)
    .populate('seller', 'name businessName phone')
    .populate('category', 'name slug')
    .sort(sorts[req.query.sort] || { createdAt: -1 });
  res.json({ products });
});

// GET /api/store/products/:id/related — same category, in stock first
exports.relatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const related = await Product.find({ category: product.category, status: 'active', _id: { $ne: product._id } })
    .populate('category', 'name slug')
    .sort({ ratingAverage: -1, createdAt: -1 })
    .limit(8);
  res.json({ products: related });
});

// POST /api/store/coupons/preview (user) { items, couponCode } — totals as the checkout will charge them
exports.previewCart = asyncHandler(async (req, res) => {
  const cart = await priceCart(req.body.items, req.body.couponCode);
  res.json({
    subtotal: cart.subtotal,
    discount: cart.discount,
    total: cart.total,
    couponCode: cart.couponCode || null,
    lines: cart.lines.map((l) => ({
      productId: l.product._id,
      variantId: l.variant ? l.variant._id : null,
      label: l.variant ? l.variant.label : null,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    })),
  });
});

// GET /api/store/payment-options — public, what the checkout may offer
exports.paymentOptions = asyncHandler(async (req, res) => {
  res.json({ razorpay: true, cod: await codEnabled() });
});

// PUT /api/store/payment-options (admin) { codEnabled }
exports.updatePaymentOptions = asyncHandler(async (req, res) => {
  if (typeof req.body.codEnabled !== 'boolean') return res.status(400).json({ message: 'codEnabled must be true or false' });
  await SystemSettings.findOneAndUpdate(
    { key: 'singleton' },
    { $set: { 'payments.codEnabled': req.body.codEnabled }, $setOnInsert: { key: 'singleton' } },
    { upsert: true }
  );
  res.json({ cod: req.body.codEnabled });
});

exports.createPaymentOrder = asyncHandler(async (req, res) => {
  const { items, idempotencyKey, couponCode } = req.body;
  const cart = await priceCart(items, couponCode);
  if (cart.total <= 0) return res.status(400).json({ message: 'Order total must be greater than zero' });

  const intent = await paymentService.createIntent({
    idempotencyKey,
    payerType: 'user',
    payerId: req.user._id,
    purpose: 'store-order',
    amount: cart.total,
    method: 'razorpay',
  });

  if (intent.razorpay?.orderId) {
    return res.json({
      paymentIntentId: intent._id,
      razorpayOrderId: intent.razorpay.orderId,
      amount: Math.round(intent.amount * 100),
      currency: intent.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  }

  const razorpayOrder = await createRazorpayOrder({
    amount: cart.total,
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

// POST /api/store/orders (user) { items, shippingAddress, couponCode, method: 'razorpay' | 'wallet' | 'cod', ...payment proof }
exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, couponCode, method = 'razorpay', paymentIntentId, razorpayPaymentId, razorpaySignature } = req.body;

  const cart = await priceCart(items, couponCode);
  if (cart.total <= 0) return res.status(400).json({ message: 'Order total must be greater than zero' });

  let intent = null;
  if (method === 'cod') {
    if (!(await codEnabled())) return res.status(400).json({ message: 'Cash on delivery is not available right now' });
  } else if (method === 'wallet') {
    intent = await paymentService.createIntent({
      payerType: 'user',
      payerId: req.user._id,
      purpose: 'store-order',
      amount: cart.total,
      method: 'wallet',
    });
    try {
      await paymentService.payIntentFromWallet(intent._id, 'user', req.user._id);
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message });
    }
  } else if (method === 'razorpay') {
    if (!paymentIntentId) return res.status(400).json({ message: 'paymentIntentId is required' });
    intent = await PaymentIntent.findById(paymentIntentId);
    if (!intent) return res.status(404).json({ message: 'Payment not found' });
    if (String(intent.payerId) !== String(req.user._id)) return res.status(403).json({ message: 'Not your payment' });
    if (intent.amount !== cart.total) {
      return res.status(400).json({ message: 'The cart changed after payment. Please check out again.' });
    }
    if (intent.status !== 'paid') {
      const valid = verifyPaymentSignature({ razorpayOrderId: intent.razorpay?.orderId, razorpayPaymentId, razorpaySignature });
      if (!valid) return res.status(400).json({ message: 'Payment verification failed' });
      intent = await paymentService.markIntentPaid(intent._id, { razorpayPaymentId, razorpaySignature });
    }
  } else {
    return res.status(400).json({ message: 'Unknown payment method' });
  }

  const orderItems = cart.lines.map((l) => ({
    product: l.product._id,
    variantId: l.variant ? l.variant._id : undefined,
    variantLabel: l.variant ? l.variant.label : undefined,
    quantity: l.quantity,
    price: l.unitPrice,
  }));

  const order = await Order.create({
    buyer: req.user._id,
    seller: cart.sellerId,
    items: orderItems,
    subtotal: cart.subtotal,
    couponCode: cart.couponCode,
    discount: cart.discount,
    total: cart.total,
    paymentMethod: method,
    status: 'pending',
    statusHistory: [{ status: 'pending', note: method === 'cod' ? 'Cash on delivery' : 'Payment received' }],
    paymentIntent: intent ? intent._id : undefined,
    shippingAddress: shippingAddress || undefined,
  });
  if (intent) await paymentService.attachReference(intent._id, 'Order', order._id);

  await decrementStock(cart.lines);
  if (cart.couponCode) await Coupon.updateOne({ code: cart.couponCode }, { $inc: { usedCount: 1 } });

  const io = req.app.get('io');
  if (io) io.to(`seller:${cart.sellerId}`).emit('order:new', { orderId: String(order._id) });
  pushService
    .sendPushToAccount('store-seller', cart.sellerId, {
      title: 'New order received',
      body: `You have a new order worth ₹${cart.total}`,
      data: { type: 'order:new', orderId: String(order._id) },
    })
    .catch(() => {});

  await order.populate('paymentIntent');
  res.status(201).json({ order });
});

// PATCH /api/store/orders/:id/status (seller, admin) { status, courierName?, trackingNumber?, note? }
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, courierName, trackingNumber, note } = req.body;
  const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (req.role === 'store-seller' && String(order.seller) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your order' });
  }
  if (status === 'shipped' && (courierName || trackingNumber)) {
    order.courier = { name: courierName || order.courier?.name, trackingNumber: trackingNumber || order.courier?.trackingNumber };
  }

  const wasActive = !['cancelled', 'returned'].includes(order.status);
  const nowInactive = ['cancelled', 'returned'].includes(status);
  if (wasActive && nowInactive) await restoreStock(order.items);

  if (status !== order.status) {
    order.statusHistory.push({ status, note: note ? String(note).slice(0, 200) : undefined });
  }
  order.status = status;
  await order.save();

  if (status === 'delivered' && !order.payoutCompletedAt) {
    order.settlement = await commissionService.settle({
      role: 'store-seller',
      ownerId: order.seller,
      amount: order.total,
      description: `Payout for order ${order._id}`,
    });
    order.payoutCompletedAt = new Date();
    await order.save();
  }

  const io = req.app.get('io');
  if (io) io.to(`user:${order.buyer}`).emit('order:update', { orderId: String(order._id), status: order.status });
  pushService
    .sendPushToAccount('user', order.buyer, {
      title: `Order ${status}`,
      body: `Your order is now ${status}`,
      data: { type: 'order:update', orderId: String(order._id) },
    })
    .catch(() => {});

  await order.populate('paymentIntent');
  res.json({ order });
});

// Buyers, the seller and admins can read one order with its timeline.
async function loadOrderFor(req, res) {
  const order = await Order.findById(req.params.id)
    .populate('buyer', 'name phone')
    .populate('seller', 'name businessName phone')
    .populate('items.product', 'name price photos')
    .populate('paymentIntent');
  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return null;
  }
  const allowed =
    req.role === 'admin' ||
    (req.role === 'user' && String(order.buyer._id) === String(req.user._id)) ||
    (req.role === 'store-seller' && String(order.seller._id) === String(req.user._id));
  if (!allowed) {
    res.status(403).json({ message: 'Not your order' });
    return null;
  }
  return order;
}

// GET /api/store/orders/:id
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await loadOrderFor(req, res);
  if (order) res.json({ order });
});

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// GET /api/store/orders/:id/invoice — printable invoice; the browser saves it as PDF.
exports.invoice = asyncHandler(async (req, res) => {
  const order = await loadOrderFor(req, res);
  if (!order) return;
  buildInvoicePdf(order, res);
});

// ---- Coupons (admin) ----

exports.listCoupons = asyncHandler(async (req, res) => {
  res.json({ coupons: await Coupon.find().sort({ createdAt: -1 }) });
});

function couponFields(body) {
  const type = body.type;
  if (!['percent', 'flat'].includes(type)) throw fail('Type must be percent or flat');
  const value = Number(body.value);
  if (!(value > 0)) throw fail('Value must be more than 0');
  if (type === 'percent' && value > 100) throw fail('A percent coupon cannot exceed 100');
  return {
    code: String(body.code || '').trim().toUpperCase(),
    type,
    value,
    minOrder: Number(body.minOrder) || 0,
    maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : undefined,
    usageLimit: Number(body.usageLimit) || 0,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    active: body.active !== false,
  };
}

exports.createCoupon = asyncHandler(async (req, res) => {
  const fields = couponFields(req.body);
  if (!fields.code) return res.status(400).json({ message: 'Code is required' });
  if (await Coupon.exists({ code: fields.code })) return res.status(409).json({ message: 'This code already exists' });
  res.status(201).json({ coupon: await Coupon.create(fields) });
});

exports.updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
  const fields = couponFields({ ...coupon.toObject(), ...req.body });
  delete fields.code;
  Object.assign(coupon, fields);
  await coupon.save();
  res.json({ coupon });
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
  res.json({ ok: true });
});

// ---- Saved products (user) ----

exports.listFavouriteProducts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'favouriteProducts',
    match: { status: 'active' },
    select: 'name price photos stock variants ratingAverage ratingCount',
  });
  res.json({ products: user?.favouriteProducts || [] });
});

exports.toggleFavouriteProduct = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const id = String(req.params.productId);
  const exists = user.favouriteProducts.some((p) => String(p) === id);
  if (exists) {
    user.favouriteProducts = user.favouriteProducts.filter((p) => String(p) !== id);
  } else {
    const product = await Product.findById(id).select('_id');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    user.favouriteProducts.push(product._id);
  }
  await user.save();
  res.json({ saved: !exists, favourites: user.favouriteProducts.map(String) });
});
