const SharedTrip = require('../models/SharedTrip');
const TransportRequest = require('../models/TransportRequest');
const Vehicle = require('../models/Vehicle');
const Transporter = require('../models/Transporter');
const pricing = require('./transportPricing.service');
const { distanceKm } = require('../utils/geo');
const { decodePolyline, locateOnPath, pathLengthKm } = require('../utils/routeGeometry');
const { fetchRoutePolyline } = require('./roadRoute.service');

// A booking can always join a host whose pickup and drop-off are both within this distance of its own.
const SHARED_RADIUS_KM = 10;
// Otherwise it joins when both its points lie this close to the host's road route, in the same direction
// (e.g. Indore → Dewas rides along a vehicle going Indore → Bhopal).
const ROUTE_CORRIDOR_KM = 6;
// The joiner must ride at least this far along the route.
const MIN_RIDE_KM = 1;
// Stops closer together than this along the route can be done in either order.
const STOP_TOLERANCE_KM = 2;

const dayOf = (date) => String(date).slice(0, 10);

// Bookings riding the run: the host and every joiner the transporter accepted, in booking order.
async function activeMembers(groupId) {
  return TransportRequest.find({ sharedGroup: groupId, status: 'accepted' }).sort({ createdAt: 1 });
}

// Joiners still waiting on the host's customer or the transporter.
async function pendingJoiners(hostId) {
  return TransportRequest.find({ hostRequest: hostId, status: 'pending', shareApproval: { $ne: 'declined' } }).sort({ createdAt: 1 });
}

// Animals already promised on a host's run, counting joiners still waiting for an answer.
async function loadFor(host) {
  const riding = host.sharedGroup ? await activeMembers(host.sharedGroup) : [host];
  const waiting = await pendingJoiners(host._id);
  return [...riding, ...waiting].reduce((sum, m) => sum + (m.animals || 1), 0);
}

// The host's assigned vehicle sets the limit. Before one is assigned, the transporter's largest vehicle of the booked type does.
async function capacityFor(host) {
  if (host.vehicle) {
    const vehicle = await Vehicle.findById(host.vehicle).select('maxAnimals');
    if (vehicle) return vehicle.maxAnimals || 0;
  }
  const vehicles = await Vehicle.find({
    transporter: host.transporter._id || host.transporter,
    active: true,
    ...(host.vehicleType ? { vehicleType: host.vehicleType } : {}),
  }).select('maxAnimals');
  return vehicles.reduce((max, v) => Math.max(max, v.maxAnimals || 0), 0);
}

// The price list a run is charged by: the admin price of the host's vehicle type.
// Older bookings made before admin pricing fall back to the transporter's own rate.
async function runPricing(host) {
  const type = await pricing.bookableType(host.vehicleType);
  if (type) return type;
  return Transporter.findById(host.transporter._id || host.transporter).select('baseFare pricePerKm');
}

// Splits one run's cost across its members.
// Run cost = the full fare for the host's route (see transportPricing.quoteFor).
// Each member pays cost × (animals × own km) / sum of (animals × own km), so bigger and longer bookings pay more.
function splitCost(prices, anchor, members) {
  const runCost = pricing.quoteFor(prices, distanceKm(anchor.source, anchor.destination)).amount;
  const weights = members.map((m) => (m.animals || 1) * distanceKm(m.source, m.destination));
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  return members.map((m, i) => {
    const share = totalWeight > 0 ? weights[i] / totalWeight : 1 / members.length;
    const km = distanceKm(m.source, m.destination);
    return {
      tripKm: Math.round(km * 10) / 10,
      pricePerKm: prices.pricePerKm || 0,
      baseFare: Math.round((prices.baseFare || 0) * share),
      amount: Math.round(runCost * share),
    };
  });
}

// What a newcomer would pay, and what the host would pay, if the newcomer joins the run.
async function estimateJoin(host, newcomer) {
  const riding = host.sharedGroup ? await activeMembers(host.sharedGroup) : [host];
  const quotes = splitCost(await runPricing(host), host, [...riding, newcomer]);
  const hostIndex = riding.findIndex((m) => String(m._id) === String(host._id));
  return { quote: quotes[quotes.length - 1], hostQuote: quotes[hostIndex] || null };
}

// The road the host's vehicle takes, from Google Directions (cached on the booking).
// Without Directions it falls back to the straight line, with a wider corridor to allow for curving roads.
async function hostPath(host) {
  let encoded = host.routePolyline;
  if (encoded === undefined && host._id) {
    encoded = (await TransportRequest.findById(host._id).select('+routePolyline'))?.routePolyline;
  }
  if (!encoded) {
    encoded = await fetchRoutePolyline(host.source, host.destination);
    if (encoded && host._id) await TransportRequest.updateOne({ _id: host._id }, { routePolyline: encoded });
  }
  if (encoded) {
    host.routePolyline = encoded;
    return { path: decodePolyline(encoded), corridorKm: ROUTE_CORRIDOR_KM };
  }
  const path = [host.source, host.destination];
  return { path, corridorKm: Math.min(30, Math.max(10, 0.15 * pathLengthKm(path))) };
}

// Whether a trip from `source` to `destination` fits on the host's run.
// Returns { fits, offKm, pickupAlongKm, dropAlongKm }; offKm is how far the trip's points are from the route.
async function fitOnRoute(host, source, destination) {
  const endpointsMatch =
    distanceKm(source, host.source) <= SHARED_RADIUS_KM && distanceKm(destination, host.destination) <= SHARED_RADIUS_KM;
  const { path, corridorKm } = await hostPath(host);
  const pick = locateOnPath(path, source);
  const drop = locateOnPath(path, destination);
  const alongRoute = pick.offKm <= corridorKm && drop.offKm <= corridorKm && drop.alongKm - pick.alongKm >= MIN_RIDE_KM;
  return {
    fits: endpointsMatch || alongRoute,
    offKm: Math.max(pick.offKm, drop.offKm),
    pickupAlongKm: pick.alongKm,
    dropAlongKm: drop.alongKm,
  };
}

// Whether a booking can still take a co-passenger: accepted, not started, not itself a joiner, run still open.
async function isOpenHost(host) {
  if (!host || host.status !== 'accepted' || host.stage !== 'scheduled' || host.paused || host.hostRequest) return false;
  if (!host.scheduledDate) return false;
  if (host.sharedGroup) {
    const group = await SharedTrip.findById(host.sharedGroup).select('status');
    if (group && group.status !== 'open') return false;
  }
  return true;
}

// Accepted bookings whose route this trip fits on, on this day, with room for `animals` more.
// Returns [{ host, transporter, capacity, load, quote, hostQuote, offKm }], closest to the route first.
async function findHostRides({ source, destination, scheduledDate, animals, excludeUser }) {
  const hosts = await TransportRequest.find({
    status: 'accepted',
    stage: 'scheduled',
    scheduledDate: dayOf(scheduledDate),
    hostRequest: { $exists: false },
    paused: { $ne: true },
    ...(excludeUser ? { user: { $ne: excludeUser } } : {}),
  }).populate('transporter');

  const rides = [];
  for (const host of hosts) {
    const t = host.transporter;
    if (!t || t.status !== 'approved' || t.sharedEnabled === false) continue;
    if (!(await isOpenHost(host))) continue;
    // Cheap check before asking for the road: the trip's pickup must be somewhere near the host's journey.
    if (distanceKm(source, host.source) > distanceKm(host.source, host.destination) + 30) continue;
    const fit = await fitOnRoute(host, source, destination);
    if (!fit.fits) continue;
    const [capacity, load] = await Promise.all([capacityFor(host), loadFor(host)]);
    if (!capacity || load + animals > capacity) continue;
    const { quote, hostQuote } = await estimateJoin(host, { source, destination, animals });
    rides.push({ host, transporter: t, capacity, load, quote, hostQuote, offKm: fit.offKm });
  }
  return rides.sort((a, b) => a.offKm - b.offKm);
}

// Returns the host's run, creating it the first time someone asks to share this booking.
async function groupForHost(host) {
  if (host.sharedGroup) {
    const existing = await SharedTrip.findById(host.sharedGroup);
    if (existing) return existing;
  }
  const group = await SharedTrip.create({
    transporter: host.transporter._id || host.transporter,
    host: host._id,
    scheduledDate: host.scheduledDate,
    source: host.source,
    destination: host.destination,
  });
  await TransportRequest.updateOne({ _id: host._id }, { sharedGroup: group._id });
  host.sharedGroup = group._id;
  return group;
}

// Reprices everyone riding the run. Called whenever a member is accepted, leaves or is cancelled, while the run is open.
async function recalcGroupQuotes(group) {
  const members = await activeMembers(group._id);
  if (!members.length) return;
  const host = (group.host && members.find((m) => String(m._id) === String(group.host))) || members[0];
  const quotes = splitCost(await runPricing(host), group, members);
  await Promise.all(
    members.map((m, i) => {
      m.quote = quotes[i];
      return m.save();
    })
  );
}

// Everyone on the run, including customers already delivered, in booking order.
async function runMembers(groupId) {
  return TransportRequest.find({ sharedGroup: groupId, status: { $in: ['accepted', 'completed'] } })
    .select('+pickupOtp +dropOtp')
    .populate('user', 'name phone')
    .sort({ createdAt: 1 });
}

// The whole run as one ordered list of stops along the host's road: every pickup and every drop.
// Stops at the same spot put pickups before drops, so nobody is left behind.
// Returns { members, stops: [{ kind, member, alongKm, done }], next } where `next` is the first stop not yet done.
async function runPlan(groupId) {
  const group = await SharedTrip.findById(groupId);
  if (!group) return { members: [], stops: [], next: null };
  const [members, host] = await Promise.all([
    runMembers(groupId),
    group.host ? TransportRequest.findById(group.host).select('+routePolyline source destination') : null,
  ]);
  const { path } = await hostPath(host || { source: group.source, destination: group.destination });
  const stops = [];
  for (const m of members) {
    const pickAlong = locateOnPath(path, m.source).alongKm;
    // A drop can never come before its own pickup, even if the road snaps them oddly.
    const dropAlong = Math.max(locateOnPath(path, m.destination).alongKm, pickAlong);
    stops.push({ kind: 'pickup', member: m, alongKm: pickAlong, done: Boolean(m.pickupVerifiedAt) });
    stops.push({ kind: 'drop', member: m, alongKm: dropAlong, done: Boolean(m.deliveredAt) });
  }
  stops.sort(
    (a, b) =>
      a.alongKm - b.alongKm ||
      (a.kind === b.kind ? 0 : a.kind === 'pickup' ? -1 : 1) ||
      a.member.createdAt - b.member.createdAt
  );
  return { members, stops, next: stops.find((st) => !st.done) || null };
}

// The stops that must be done before this customer's pickup or drop: every unfinished stop earlier on the road.
// Stops within STOP_TOLERANCE_KM of each other can be done in either order.
async function blockingStops(request, kind) {
  if (!request.sharedGroup) return [];
  const { stops } = await runPlan(request.sharedGroup);
  const me = stops.find((st) => st.kind === kind && String(st.member._id) === String(request._id));
  if (!me) return [];
  return stops.filter((st) => st !== me && !st.done && st.alongKm < me.alongKm - STOP_TOLERANCE_KM);
}

module.exports = {
  SHARED_RADIUS_KM,
  fitOnRoute,
  runMembers,
  runPlan,
  blockingStops,
  dayOf,
  activeMembers,
  pendingJoiners,
  loadFor,
  capacityFor,
  runPricing,
  estimateJoin,
  isOpenHost,
  findHostRides,
  groupForHost,
  recalcGroupQuotes,
};
