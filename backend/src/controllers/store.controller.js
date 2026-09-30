const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const ProductSubCategory = require('../models/ProductSubCategory');
const Order = require('../models/Order');
const StoreSeller = require('../models/StoreSeller');
const asyncHandler = require('../utils/asyncHandler');

exports.listProducts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.role === 'store-seller') {
    filter.seller = req.user._id;
  } else if (req.role !== 'admin') {
    filter.status = 'active';
  }
  if (req.query.status && req.role === 'admin') filter.status = req.query.status;
  if (req.query.subCategory) filter.subCategory = req.query.subCategory;

  const products = await Product.find(filter)
    .populate('seller', 'name businessName phone')
    .populate({ path: 'subCategory', select: 'name category', populate: { path: 'category', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json({ products });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('seller', 'name businessName phone')
    .populate('subCategory', 'name category');
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

exports.listOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.role === 'store-seller') filter.seller = req.user._id;
  const orders = await Order.find(filter)
    .populate('buyer', 'name phone')
    .populate('seller', 'name businessName phone')
    .populate('items.product', 'name price')
    .sort({ createdAt: -1 });
  res.json({ orders });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (req.role === 'store-seller' && String(order.seller) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your order' });
  }
  order.status = status;
  await order.save();
  res.json({ order });
});

// ---- Product categories & subcategories (admin manages, everyone can read) ----

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

exports.listSubCategories = asyncHandler(async (req, res) => {
  const filter = req.query.category ? { category: req.query.category } : {};
  const subCategories = await ProductSubCategory.find(filter).populate('category', 'name').sort({ name: 1 });
  res.json({ subCategories });
});

exports.createSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await ProductSubCategory.create(req.body);
  res.status(201).json({ subCategory });
});

exports.updateSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await ProductSubCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!subCategory) return res.status(404).json({ message: 'Subcategory not found' });
  res.json({ subCategory });
});

exports.removeSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await ProductSubCategory.findByIdAndDelete(req.params.id);
  if (!subCategory) return res.status(404).json({ message: 'Subcategory not found' });
  res.json({ message: 'Subcategory removed' });
});
