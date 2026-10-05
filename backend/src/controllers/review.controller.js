const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/store/reviews?productId=  (public)
exports.listForProduct = asyncHandler(async (req, res) => {
  const { productId } = req.query;
  if (!productId) return res.status(400).json({ message: 'productId is required' });

  const reviews = await Review.find({ product: productId })
    .populate('buyer', 'name')
    .sort({ createdAt: -1 });
  res.json({ reviews });
});

// GET /api/store/reviews/mine  (store-seller — reviews across all of their products)
exports.listMine = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ seller: req.user._id })
    .populate('buyer', 'name')
    .populate('product', 'name photos')
    .sort({ createdAt: -1 });

  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  res.json({ reviews, summary: { count, average: Math.round(average * 10) / 10 } });
});

// POST /api/store/reviews  (user)
exports.create = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;
  const numericRating = Number(rating);
  if (!productId || !numericRating || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: 'productId and a rating from 1-5 are required' });
  }

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  // Only people who received the product can review it.
  const bought = await Order.exists({ buyer: req.user._id, status: 'delivered', 'items.product': product._id });
  if (!bought) return res.status(403).json({ message: 'You can review a product after it is delivered to you' });

  try {
    const review = await Review.create({
      product: product._id,
      seller: product.seller,
      buyer: req.user._id,
      rating: numericRating,
      comment,
    });

    const [agg] = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await Product.updateOne(
      { _id: product._id },
      { ratingAverage: Math.round((agg?.average || 0) * 10) / 10, ratingCount: agg?.count || 0 }
    );

    res.status(201).json({ review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    throw err;
  }
});
