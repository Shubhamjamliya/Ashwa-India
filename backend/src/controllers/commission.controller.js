const CommissionRule = require('../models/CommissionRule');
const TransportRequest = require('../models/TransportRequest');
const ServiceRequest = require('../models/ServiceRequest');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const commissionService = require('../services/commission.service');

const PARTY_FIELDS = 'name businessName phone';

// Each partner type's bookings live in one collection, and each has its own field for the partner.
const SOURCES = {
  transporter: { Model: TransportRequest, field: 'transporter', match: { paymentStatus: 'settled' } },
  provider: { Model: ServiceRequest, field: 'provider', match: { paymentStatus: 'settled' } },
  'store-seller': { Model: Order, field: 'seller', match: { 'settlement.settledAt': { $exists: true } } },
};

function totalsOf(docs) {
  return docs.reduce(
    (acc, d) => {
      acc.count += 1;
      acc.gross += d.settlement.grossAmount;
      acc.commission += d.settlement.commission;
      acc.net += d.settlement.netAmount;
      return acc;
    },
    { count: 0, gross: 0, commission: 0, net: 0 }
  );
}

function rowFor(doc, role) {
  const party = doc[SOURCES[role].field];
  const kind = role === 'transporter' ? 'Transport' : role === 'provider' ? doc.serviceType : 'Store order';
  return {
    id: doc._id,
    role,
    kind,
    party: party ? party.businessName || party.name || party.phone : '—',
    gross: doc.settlement.grossAmount,
    commission: doc.settlement.commission,
    net: doc.settlement.netAmount,
    settledAt: doc.settlement.settledAt,
  };
}

async function settledDocs(role) {
  const { Model, field, match } = SOURCES[role];
  return Model.find(match).populate(field, PARTY_FIELDS);
}

// GET /api/commissions/rules  (admin)
exports.listRules = asyncHandler(async (req, res) => {
  const rules = await commissionService.getAllRules();
  res.json({ rules });
});

// PUT /api/commissions/rules/:role  (admin) { percent, fixedPerBooking, active }
exports.updateRule = asyncHandler(async (req, res) => {
  const { role } = req.params;
  if (!commissionService.ROLES.includes(role)) return res.status(400).json({ message: 'Unknown role' });

  const { percent, fixedPerBooking, active } = req.body;
  const update = {};
  if (percent !== undefined) {
    if (typeof percent !== 'number' || percent < 0 || percent > 100) {
      return res.status(400).json({ message: 'Percent must be a number between 0 and 100' });
    }
    update.percent = percent;
  }
  if (fixedPerBooking !== undefined) {
    if (typeof fixedPerBooking !== 'number' || fixedPerBooking < 0) {
      return res.status(400).json({ message: 'Fixed fee must be a number, 0 or more' });
    }
    update.fixedPerBooking = fixedPerBooking;
  }
  if (active !== undefined) {
    if (typeof active !== 'boolean') return res.status(400).json({ message: 'active must be true or false' });
    update.active = active;
  }

  await commissionService.getRule(role);
  const rule = await CommissionRule.findOneAndUpdate({ role }, update, { new: true });
  res.json({ rule });
});

// GET /api/commissions/summary  (admin)
exports.adminSummary = asyncHandler(async (req, res) => {
  const docsByRole = {};
  for (const role of Object.keys(SOURCES)) {
    docsByRole[role] = (await settledDocs(role)).map((d) => ({ doc: d, role }));
  }

  const everything = Object.entries(docsByRole).flatMap(([role, rows]) => rows.map((r) => ({ ...r, row: rowFor(r.doc, role) })));
  const recent = everything
    .map((r) => r.row)
    .sort((a, b) => new Date(b.settledAt) - new Date(a.settledAt))
    .slice(0, 50);

  const perRole = (role) => ({ ...totalsOf(docsByRole[role].map((r) => r.doc)), recent: docsByRole[role].map((r) => rowFor(r.doc, role)).sort((a, b) => new Date(b.settledAt) - new Date(a.settledAt)).slice(0, 100) });

  res.json({
    transporter: perRole('transporter'),
    provider: perRole('provider'),
    'store-seller': perRole('store-seller'),
    total: totalsOf(everything.map((r) => r.doc)),
    recent,
  });
});

// GET /api/commissions/me  (transporter | provider | store-seller)
exports.myEarnings = asyncHandler(async (req, res) => {
  const role = req.role;
  const { Model, field, match } = SOURCES[role];
  const rule = await commissionService.getRule(role);

  const docs = await Model.find({ ...match, [field]: req.user._id })
    .populate(field, PARTY_FIELDS)
    .sort({ 'settlement.settledAt': -1 })
    .limit(200);

  res.json({
    rule: { percent: rule.percent, fixedPerBooking: rule.fixedPerBooking, active: rule.active },
    totals: totalsOf(docs),
    settlements: docs.map((d) => rowFor(d, role)),
  });
});
