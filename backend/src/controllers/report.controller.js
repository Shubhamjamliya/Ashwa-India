const Order = require('../models/Order');
const Product = require('../models/Product');
const ServiceRequest = require('../models/ServiceRequest');
const TransportRequest = require('../models/TransportRequest');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Transporter = require('../models/Transporter');
const StoreSeller = require('../models/StoreSeller');
const HorseSeller = require('../models/HorseSeller');
const asyncHandler = require('../utils/asyncHandler');

// Every report returns the same shape so one admin screen can render all of them:
// { summary: [{ label, value, format }], columns: [{ key, label, format }], rows: [...] }
// format is 'money' | 'number' | 'date' | 'text'.

const money = (n) => Math.round((Number(n) || 0) * 100) / 100;
const dateRange = (req) => {
  const range = {};
  if (req.query.from) range.$gte = new Date(req.query.from);
  if (req.query.to) range.$lte = new Date(req.query.to);
  return Object.keys(range).length ? { createdAt: range } : {};
};
const personName = (p) => (p ? p.businessName || p.name || p.phone || '—' : '—');
const shortId = (id) => String(id || '').slice(-8).toUpperCase();

// ---------- Sales: store orders ----------
async function salesReport(req) {
  const orders = await Order.find(dateRange(req))
    .populate('buyer', 'name phone')
    .populate('seller', 'name businessName')
    .sort({ createdAt: -1 })
    .limit(5000);
  const completed = orders.filter((o) => o.status === 'delivered');
  const cancelled = orders.filter((o) => o.status === 'cancelled' || o.status === 'returned');
  const gross = completed.reduce((s, o) => s + (o.total || 0), 0);
  return {
    summary: [
      { label: 'Orders', value: orders.length, format: 'number' },
      { label: 'Delivered', value: completed.length, format: 'number' },
      { label: 'Cancelled / returned', value: cancelled.length, format: 'number' },
      { label: 'Delivered sales', value: money(gross), format: 'money' },
      { label: 'Average order value', value: completed.length ? money(gross / completed.length) : 0, format: 'money' },
    ],
    columns: [
      { key: 'order', label: 'Order', format: 'text' },
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'buyer', label: 'Buyer', format: 'text' },
      { key: 'seller', label: 'Seller', format: 'text' },
      { key: 'items', label: 'Items', format: 'number' },
      { key: 'total', label: 'Total', format: 'money' },
      { key: 'payment', label: 'Payment', format: 'text' },
      { key: 'status', label: 'Status', format: 'text' },
    ],
    rows: orders.map((o) => ({
      order: shortId(o._id),
      date: o.createdAt,
      buyer: personName(o.buyer),
      seller: personName(o.seller),
      items: (o.items || []).reduce((s, i) => s + (i.quantity || 1), 0),
      total: money(o.total),
      payment: o.paymentMethod,
      status: o.status,
    })),
  };
}

// ---------- Transport bookings ----------
async function transportReport(req) {
  const bookings = await TransportRequest.find(dateRange(req))
    .populate('user', 'name phone')
    .populate('transporter', 'name businessName')
    .sort({ createdAt: -1 })
    .limit(5000);
  const completed = bookings.filter((b) => b.status === 'completed');
  const commission = completed.reduce((s, b) => s + (b.settlement?.commission || 0), 0);
  const revenue = completed.reduce((s, b) => s + (b.quote?.amount || 0), 0);
  return {
    summary: [
      { label: 'Bookings', value: bookings.length, format: 'number' },
      { label: 'Completed', value: completed.length, format: 'number' },
      { label: 'Accepted, in progress', value: bookings.filter((b) => b.status === 'accepted').length, format: 'number' },
      { label: 'Trip revenue', value: money(revenue), format: 'money' },
      { label: 'Platform commission', value: money(commission), format: 'money' },
    ],
    columns: [
      { key: 'booking', label: 'Booking', format: 'text' },
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'user', label: 'User', format: 'text' },
      { key: 'transporter', label: 'Transporter', format: 'text' },
      { key: 'route', label: 'Route', format: 'text' },
      { key: 'type', label: 'Type', format: 'text' },
      { key: 'amount', label: 'Amount', format: 'money' },
      { key: 'commission', label: 'Commission', format: 'money' },
      { key: 'status', label: 'Status', format: 'text' },
    ],
    rows: bookings.map((b) => ({
      booking: shortId(b._id),
      date: b.createdAt,
      user: personName(b.user),
      transporter: personName(b.transporter),
      route: `${b.source?.address || '—'} → ${b.destination?.address || '—'}`,
      type: b.type,
      amount: money(b.quote?.amount),
      commission: money(b.settlement?.commission),
      status: b.status,
    })),
  };
}

// ---------- Service bookings (providers) ----------
async function serviceReport(req) {
  const requests = await ServiceRequest.find(dateRange(req))
    .populate('user', 'name phone')
    .populate('provider', 'name businessName')
    .sort({ createdAt: -1 })
    .limit(5000);
  const completed = requests.filter((r) => r.status === 'completed');
  const revenue = completed.reduce((s, r) => s + (r.amount || 0), 0);
  const commission = completed.reduce((s, r) => s + (r.settlement?.commission || 0), 0);
  return {
    summary: [
      { label: 'Requests', value: requests.length, format: 'number' },
      { label: 'Completed', value: completed.length, format: 'number' },
      { label: 'Pending', value: requests.filter((r) => r.status === 'pending').length, format: 'number' },
      { label: 'Service revenue', value: money(revenue), format: 'money' },
      { label: 'Platform commission', value: money(commission), format: 'money' },
    ],
    columns: [
      { key: 'request', label: 'Request', format: 'text' },
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'user', label: 'User', format: 'text' },
      { key: 'provider', label: 'Provider', format: 'text' },
      { key: 'amount', label: 'Amount', format: 'money' },
      { key: 'commission', label: 'Commission', format: 'money' },
      { key: 'status', label: 'Status', format: 'text' },
    ],
    rows: requests.map((r) => ({
      request: shortId(r._id),
      date: r.createdAt,
      user: personName(r.user),
      provider: personName(r.provider),
      amount: money(r.amount),
      commission: money(r.settlement?.commission),
      status: r.status,
    })),
  };
}

// ---------- Product sales (from order items, cancelled and returned excluded) ----------
async function productReport(req) {
  const match = { ...dateRange(req), status: { $nin: ['cancelled', 'returned'] } };
  const orders = await Order.find(match).select('items');
  const byProduct = new Map();
  for (const o of orders) {
    for (const item of o.items || []) {
      const key = String(item.product);
      const row = byProduct.get(key) || { product: key, units: 0, revenue: 0 };
      row.units += item.quantity || 1;
      row.revenue += (item.price || 0) * (item.quantity || 1);
      byProduct.set(key, row);
    }
  }
  const products = await Product.find({ _id: { $in: [...byProduct.keys()] } }).select('name stock seller');
  const nameMap = Object.fromEntries(products.map((p) => [String(p._id), p]));
  const rows = [...byProduct.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .map((r) => ({
      product: nameMap[r.product]?.name || 'Removed product',
      units: r.units,
      revenue: money(r.revenue),
      stock: nameMap[r.product]?.stock ?? '—',
    }));
  const totalUnits = rows.reduce((s, r) => s + r.units, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  return {
    summary: [
      { label: 'Products sold', value: rows.length, format: 'number' },
      { label: 'Units sold', value: totalUnits, format: 'number' },
      { label: 'Product revenue', value: money(totalRevenue), format: 'money' },
      { label: 'Top product', value: rows[0]?.product || '—', format: 'text' },
    ],
    columns: [
      { key: 'product', label: 'Product', format: 'text' },
      { key: 'units', label: 'Units sold', format: 'number' },
      { key: 'revenue', label: 'Revenue', format: 'money' },
      { key: 'stock', label: 'Stock left', format: 'number' },
    ],
    rows,
  };
}

// ---------- Revenue: what the platform earned, by source ----------
async function revenueReport(req) {
  const range = dateRange(req);
  const [store, transport, service] = await Promise.all([
    Order.find({ ...range, 'settlement.settledAt': { $exists: true } }).select('settlement'),
    TransportRequest.find({ ...range, paymentStatus: 'settled' }).select('settlement'),
    ServiceRequest.find({ ...range, paymentStatus: 'settled' }).select('settlement'),
  ]);
  const tally = (docs) =>
    docs.reduce(
      (acc, d) => {
        acc.count += 1;
        acc.gross += d.settlement?.grossAmount || 0;
        acc.commission += d.settlement?.commission || 0;
        acc.net += d.settlement?.netAmount || 0;
        return acc;
      },
      { count: 0, gross: 0, commission: 0, net: 0 }
    );
  const sources = [
    { source: 'Store sales (sellers)', ...tally(store) },
    { source: 'Transport (transporters)', ...tally(transport) },
    { source: 'Services (providers)', ...tally(service) },
  ];
  const total = sources.reduce(
    (acc, s) => ({ count: acc.count + s.count, gross: acc.gross + s.gross, commission: acc.commission + s.commission, net: acc.net + s.net }),
    { count: 0, gross: 0, commission: 0, net: 0 }
  );
  return {
    summary: [
      { label: 'Settled bookings & orders', value: total.count, format: 'number' },
      { label: 'Gross value', value: money(total.gross), format: 'money' },
      { label: 'Platform revenue (commission)', value: money(total.commission), format: 'money' },
      { label: 'Paid out to partners', value: money(total.net), format: 'money' },
    ],
    columns: [
      { key: 'source', label: 'Source', format: 'text' },
      { key: 'count', label: 'Settled', format: 'number' },
      { key: 'gross', label: 'Gross', format: 'money' },
      { key: 'commission', label: 'Commission', format: 'money' },
      { key: 'net', label: 'Paid out', format: 'money' },
    ],
    rows: sources.map((s) => ({ ...s, gross: money(s.gross), commission: money(s.commission), net: money(s.net) })),
  };
}

// ---------- Users: new accounts by role ----------
async function userReport(req) {
  const range = dateRange(req);
  const accountTypes = [
    { role: 'User', Model: User, fields: 'name phone' },
    { role: 'Service provider', Model: Provider, fields: 'name businessName phone' },
    { role: 'Transporter', Model: Transporter, fields: 'name businessName phone' },
    { role: 'Store seller', Model: StoreSeller, fields: 'name businessName phone' },
    { role: 'Horse seller', Model: HorseSeller, fields: 'name businessName phone' },
  ];
  const lists = await Promise.all(accountTypes.map(({ Model, fields }) => Model.find(range).select(`${fields} createdAt`).sort({ createdAt: -1 }).limit(2000)));
  const rows = [];
  const counts = accountTypes.map((t, i) => {
    for (const a of lists[i]) rows.push({ role: t.role, name: a.businessName || a.name || '—', phone: a.phone, joined: a.createdAt });
    return { label: t.role, value: lists[i].length, format: 'number' };
  });
  rows.sort((a, b) => new Date(b.joined) - new Date(a.joined));
  return {
    summary: [{ label: 'New accounts', value: rows.length, format: 'number' }, ...counts],
    columns: [
      { key: 'role', label: 'Role', format: 'text' },
      { key: 'name', label: 'Name', format: 'text' },
      { key: 'phone', label: 'Phone', format: 'text' },
      { key: 'joined', label: 'Joined', format: 'date' },
    ],
    rows,
  };
}

const REPORTS = {
  sales: salesReport,
  transport: transportReport,
  service: serviceReport,
  product: productReport,
  revenue: revenueReport,
  users: userReport,
};

// GET /api/reports/:type?from=&to=  (admin)
exports.report = asyncHandler(async (req, res) => {
  const build = REPORTS[req.params.type];
  if (!build) return res.status(404).json({ message: 'Unknown report' });
  res.json(await build(req));
});
