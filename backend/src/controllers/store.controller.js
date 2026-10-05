const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const Order = require('../models/Order');
const StoreSeller = require('../models/StoreSeller');
const PaymentIntent = require('../models/PaymentIntent');
const asyncHandler = require('../utils/asyncHandler');
const { createRazorpayOrder, verifyPaymentSignature } = require('../utils/razorpay');
const pushService = require('../services/push.service');
const paymentService = require('../services/payment.service');

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
