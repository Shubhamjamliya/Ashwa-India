const CommissionRule = require('../models/CommissionRule');
const TransportRequest = require('../models/TransportRequest');
const ServiceRequest = require('../models/ServiceRequest');
const asyncHandler = require('../utils/asyncHandler');
const commissionService = require('../services/commission.service');

const PARTY_FIELDS = { transporter: 'name businessName phone', provider: 'name businessName phone' };

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
  const party = role === 'transporter' ? doc.transporter : doc.provider;
  return {
    id: doc._id,
    role,
    kind: role === 'transporter' ? 'Transport' : doc.serviceType,
    party: party ? party.businessName || party.name || party.phone : '—',
    gross: doc.settlement.grossAmount,
    commission: doc.settlement.commission,
    net: doc.settlement.netAmount,
    settledAt: doc.settlement.settledAt,
  };
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
  const [transportDocs, serviceDocs] = await Promise.all([
    TransportRequest.find({ paymentStatus: 'settled' }).populate('transporter', PARTY_FIELDS.transporter),
    ServiceRequest.find({ paymentStatus: 'settled' }).populate('provider', PARTY_FIELDS.provider),
  ]);

  const recent = [
    ...transportDocs.map((d) => rowFor(d, 'transporter')),
    ...serviceDocs.map((d) => rowFor(d, 'provider')),
  ]
    .sort((a, b) => new Date(b.settledAt) - new Date(a.settledAt))
    .slice(0, 50);

  res.json({
    transporter: totalsOf(transportDocs),
    provider: totalsOf(serviceDocs),
    total: totalsOf([...transportDocs, ...serviceDocs]),
    recent,
  });
});

// GET /api/commissions/me  (transporter | provider)
exports.myEarnings = asyncHandler(async (req, res) => {
  const role = req.role;
  const rule = await commissionService.getRule(role);
  const Model = role === 'transporter' ? TransportRequest : ServiceRequest;
  const field = role === 'transporter' ? 'transporter' : 'provider';

  const docs = await Model.find({ [field]: req.user._id, paymentStatus: 'settled' })
    .populate(field, PARTY_FIELDS[role])
    .sort({ 'settlement.settledAt': -1 })
    .limit(200);

  res.json({
    rule: { percent: rule.percent, fixedPerBooking: rule.fixedPerBooking, active: rule.active },
    totals: totalsOf(docs),
    settlements: docs.map((d) => rowFor(d, role)),
  });
});
