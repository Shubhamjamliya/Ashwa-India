const SharedTrip = require('../models/SharedTrip');
const TransportRequest = require('../models/TransportRequest');
const Vehicle = require('../models/Vehicle');
const { distanceKm } = require('../utils/geo');

// Two bookings share a run when both their pickup and drop-off are within this distance of the group's anchor route.
const SHARED_RADIUS_KM = 10;
const ACTIVE_STATUSES = ['pending', 'accepted'];

const dayOf = (date) => String(date).slice(0, 10);

// Largest animal count any of the transporter's shared vehicles can carry.
// A shared booking is refused when no shared vehicle exists, since nothing could carry it.
async function maxSharedCapacity(transporterId) {
  const vehicles = await Vehicle.find({ transporter: transporterId, active: true, shared: true }).select('maxAnimals');
  return vehicles.reduce((max, v) => Math.max(max, v.maxAnimals || 0), 0);
}

// Bookings still counting toward a group's load: not declined or cancelled.
async function activeMembers(groupId) {
  return TransportRequest.find({ sharedGroup: groupId, status: { $in: ACTIVE_STATUSES } }).sort({ createdAt: 1 });
}

// Finds an open group this booking can join, or starts a new one.
// Returns { group, capacity } or throws an Error with a `status` for the controller to return.
async function joinOrCreateGroup({ transporter, source, destination, scheduledDate, animals }) {
  const capacity = await maxSharedCapacity(transporter._id);
  if (!capacity) {
    const err = new Error('This transporter has no shared vehicle set up yet');
    err.status = 400;
    throw err;
  }
  if (animals > capacity) {
    const err = new Error(`Shared trips carry up to ${capacity} animal(s) per vehicle for this transporter`);
    err.status = 400;
    throw err;
  }

  const date = dayOf(scheduledDate);
  const candidates = await SharedTrip.find({ transporter: transporter._id, scheduledDate: date, status: 'open' });
  for (const group of candidates) {
    const sameRoute =
      distanceKm(source, group.source) <= SHARED_RADIUS_KM && distanceKm(destination, group.destination) <= SHARED_RADIUS_KM;
    if (!sameRoute) continue;
    const members = await activeMembers(group._id);
    const load = members.reduce((sum, m) => sum + (m.animals || 1), 0);
    if (load + animals <= capacity) return { group, capacity };
  }

  const group = await SharedTrip.create({ transporter: transporter._id, scheduledDate: date, source, destination });
  return { group, capacity };
}

// Splits the group's trip cost across its members.
// Group cost = baseFare + (anchor route km × pricePerKm).
// Each member pays cost × (animals × own km) / sum of (animals × own km), so bigger and longer bookings pay more.
// Called whenever a member joins, declines or cancels, while the group is still open.
async function recalcGroupQuotes(transporter, group) {
  const members = await activeMembers(group._id);
  if (!members.length) return;

  const anchorKm = distanceKm(group.source, group.destination);
  const groupCost = (transporter.baseFare || 0) + anchorKm * transporter.pricePerKm;
  const weights = members.map((m) => (m.animals || 1) * distanceKm(m.source, m.destination));
  const totalWeight = weights.reduce((s, w) => s + w, 0);

  await Promise.all(
    members.map((m, i) => {
      const share = totalWeight > 0 ? weights[i] / totalWeight : 1 / members.length;
      const km = distanceKm(m.source, m.destination);
      m.quote = {
        tripKm: Math.round(km * 10) / 10,
        pricePerKm: transporter.pricePerKm,
        baseFare: Math.round((transporter.baseFare || 0) * share),
        amount: Math.round(groupCost * share),
      };
      return m.save();
    })
  );
}

// FIFO: a member's pickup needs every earlier member picked up, and a member's drop needs every earlier member delivered.
async function earlierMembers(request) {
  if (!request.sharedGroup) return [];
  return TransportRequest.find({
    sharedGroup: request.sharedGroup,
    status: 'accepted',
    createdAt: { $lt: request.createdAt },
  }).sort({ createdAt: 1 });
}

module.exports = {
  SHARED_RADIUS_KM,
  maxSharedCapacity,
  activeMembers,
  joinOrCreateGroup,
  recalcGroupQuotes,
  earlierMembers,
};
