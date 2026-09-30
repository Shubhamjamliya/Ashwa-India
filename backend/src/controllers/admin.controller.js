const User = require('../models/User');
const HorseSeller = require('../models/HorseSeller');
const StoreSeller = require('../models/StoreSeller');
const Provider = require('../models/Provider');
const Horse = require('../models/Horse');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    horseListings,
    activeOrders,
    pendingProviders,
    horseSellers,
    storeSellers,
  ] = await Promise.all([
    User.countDocuments(),
    Horse.countDocuments({ status: 'listed' }),
    Order.countDocuments({ status: { $in: ['pending', 'processing', 'shipped'] } }),
    Provider.countDocuments({ status: 'pending' }),
    HorseSeller.countDocuments(),
    StoreSeller.countDocuments(),
  ]);

  const revenueAgg = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);

  res.json({
    totalUsers,
    horseListings,
    activeOrders,
    pendingProviders,
    horseSellers,
    storeSellers,
    grossRevenue: revenueAgg[0]?.total || 0,
  });
});
