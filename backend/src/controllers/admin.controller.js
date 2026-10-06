const User = require('../models/User');
const HorseSeller = require('../models/HorseSeller');
const StoreSeller = require('../models/StoreSeller');
const Provider = require('../models/Provider');
const Transporter = require('../models/Transporter');
const Horse = require('../models/Horse');
const Inquiry = require('../models/Inquiry');
const Order = require('../models/Order');
const Product = require('../models/Product');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const TransportRequest = require('../models/TransportRequest');
const ServiceRequest = require('../models/ServiceRequest');
const asyncHandler = require('../utils/asyncHandler');

// Start of the period picked on the dashboard. null means all time.
function periodStart(period) {
  const now = new Date();
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'week') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - start.getDay());
    return start;
  }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

// Every booking-type record, mapped to one of four dashboard statuses.
const STATUS_GROUP = {
  completed: 'Completed',
  delivered: 'Completed',
  accepted: 'Ongoing',
  pending: 'Pending',
  processing: 'Ongoing',
  shipped: 'Ongoing',
  in_transit: 'Ongoing',
  cancelled: 'Cancelled',
  rejected: 'Cancelled',
  returned: 'Cancelled',
};

// Money that actually settled on a booking or order (gross, before commission).
const grossOf = (doc) => doc?.settlement?.grossAmount || 0;

// GET /api/admin/dashboard?period=overall|today|week|month
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const period = ['today', 'week', 'month'].includes(req.query.period) ? req.query.period : 'overall';
  const start = periodStart(period);
  const inPeriod = start ? { createdAt: { $gte: start } } : {};

  const [
    totalUsers,
    newUsers,
    horseListings,
    storeSellers,
    horseSellers,
    pendingProviders,
    pendingTransporters,
    openEnquiries,
    activeOrders,
    activeTransport,
    activeService,
    transportRequests,
    orders,
    serviceRequests,
    settledOrders,
    settledTransport,
    settledService,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments(inPeriod),
    Horse.countDocuments({ status: 'listed' }),
    StoreSeller.countDocuments({ status: 'approved' }),
    HorseSeller.countDocuments({ status: 'approved' }),
    Provider.countDocuments({ status: 'pending' }),
    Transporter.countDocuments({ status: 'pending' }),
    Inquiry.countDocuments({ status: 'open' }),
    Order.countDocuments({ status: { $in: ['pending', 'processing', 'shipped'] } }),
    TransportRequest.countDocuments({ status: 'accepted' }),
    ServiceRequest.countDocuments({ status: 'accepted' }),
    TransportRequest.countDocuments(inPeriod),
    Order.find(inPeriod).select('status').lean(),
    ServiceRequest.find(inPeriod).select('status').lean(),
    Order.find({ ...inPeriod, 'settlement.settledAt': { $exists: true } }).select('settlement').lean(),
    TransportRequest.find({ ...inPeriod, paymentStatus: 'settled' }).select('settlement').lean(),
    ServiceRequest.find({ ...inPeriod, paymentStatus: 'settled' }).select('settlement').lean(),
  ]);

  const [commissionEarned, pendingWithdrawals, liveTrips, lowStockProducts] = await Promise.all([
    Promise.all([
      Order.find({ ...inPeriod, 'settlement.settledAt': { $exists: true } }).select('settlement').lean(),
      TransportRequest.find({ ...inPeriod, paymentStatus: 'settled' }).select('settlement').lean(),
      ServiceRequest.find({ ...inPeriod, paymentStatus: 'settled' }).select('settlement').lean(),
    ]).then((lists) => lists.flat().reduce((sum, d) => sum + (d.settlement?.commission || 0), 0)),
    WithdrawalRequest.aggregate([
      { $match: { status: { $in: ['requested', 'approved'] } } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } },
    ]),
    TransportRequest.countDocuments({ status: 'accepted', stage: { $in: ['scheduled', 'to_pickup', 'in_transit'] } }),
    Product.countDocuments({ stock: { $lte: 5 } }),
  ]);

  // Booking status split for the pie chart, across transport, service and store orders.
  const split = { Completed: 0, Ongoing: 0, Pending: 0, Cancelled: 0 };
  for (const doc of [...orders, ...serviceRequests, ...(await TransportRequest.find(inPeriod).select('status').lean())]) {
    const group = STATUS_GROUP[doc.status];
    if (group) split[group] += 1;
  }

  const grossRevenue = [...settledOrders, ...settledTransport, ...settledService].reduce((sum, d) => sum + grossOf(d), 0);

  // Six-month trend, always shown regardless of the period filter.
  const now = new Date();
  const trend = [];
  for (let i = 5; i >= 0; i -= 1) {
    const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const range = { createdAt: { $gte: from, $lt: to } };
    const [tCount, sCount, oCount, oSettled, tSettled, sSettled] = await Promise.all([
      TransportRequest.countDocuments(range),
      ServiceRequest.countDocuments(range),
      Order.countDocuments(range),
      Order.find({ ...range, 'settlement.settledAt': { $exists: true } }).select('settlement').lean(),
      TransportRequest.find({ ...range, paymentStatus: 'settled' }).select('settlement').lean(),
      ServiceRequest.find({ ...range, paymentStatus: 'settled' }).select('settlement').lean(),
    ]);
    trend.push({
      month: from.toLocaleString('en-IN', { month: 'short' }),
      bookings: tCount + sCount + oCount,
      revenue: [...oSettled, ...tSettled, ...sSettled].reduce((sum, d) => sum + grossOf(d), 0),
    });
  }

  res.json({
    period,
    totals: {
      totalUsers,
      newUsers,
      horseListings,
      sellers: storeSellers + horseSellers,
      activeBookings: activeOrders + activeTransport + activeService,
      transportRequests,
      grossRevenue,
      pendingApprovals: pendingProviders + pendingTransporters,
      openEnquiries,
      commissionEarned,
      pendingWithdrawals: pendingWithdrawals[0]?.count || 0,
      pendingWithdrawalAmount: pendingWithdrawals[0]?.amount || 0,
      liveTrips,
      lowStockProducts,
    },
    statusSplit: Object.entries(split).map(([name, value]) => ({ name, value })),
    trend,
  });
});
