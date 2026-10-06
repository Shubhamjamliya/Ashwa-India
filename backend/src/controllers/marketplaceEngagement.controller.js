const Horse = require('../models/Horse');
const Inquiry = require('../models/Inquiry');
const VisitRequest = require('../models/VisitRequest');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const pushService = require('../services/push.service');

const HORSE_FIELDS = 'name breed photos price leaseRate leasePeriod listingType status';

// Only the buyer and the seller of an inquiry can read or write its thread.
// Works whether buyer/seller are plain ids or populated documents (getThread populates them).
const idOf = (ref) => String(ref?._id || ref);

function canAccess(inquiry, req) {
  if (req.role === 'user') return idOf(inquiry.buyer) === String(req.user._id);
  if (req.role === 'horse-seller') return idOf(inquiry.seller) === String(req.user._id);
  return false;
}

// Tells the other party about new activity: a live socket event plus a push notification.
function notifyOther(req, { room, role, accountId, socketEvent, payload, title, body, type, extra = {} }) {
  const io = req.app.get('io');
  if (io) io.to(room).emit(socketEvent, payload);
  pushService
    .sendPushToAccount(role, accountId, { title, body, data: { type, accountId: String(accountId), ...extra } })
    .catch(() => {});
}

const preview = (text) => (text.length > 100 ? `${text.slice(0, 100)}…` : text);

// GET /api/marketplace/inquiries/mine  (user)
exports.listMyInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Inquiry.find({ buyer: req.user._id })
    .select('-messages')
    .populate('horse', HORSE_FIELDS)
    .populate('seller', 'name businessName phone')
    .sort({ lastMessageAt: -1 });
  res.json({ inquiries });
});

// GET /api/marketplace/inquiries/:id  (buyer or seller) — full thread
exports.getThread = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id)
    .populate('horse', HORSE_FIELDS)
    .populate('seller', 'name businessName phone')
    .populate('buyer', 'name phone');
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  if (!canAccess(inquiry, req)) return res.status(403).json({ message: 'Not your conversation' });
  res.json({ inquiry });
});

// POST /api/marketplace/inquiries/:id/messages  (buyer or seller) { text }
exports.postMessage = asyncHandler(async (req, res) => {
  let text = String(req.body.text || '').trim();
  const hasOffer = req.body.offerAmount !== undefined && req.body.offerAmount !== null && req.body.offerAmount !== '';
  const offer = hasOffer ? Number(req.body.offerAmount) : undefined;
  if (hasOffer && (!Number.isFinite(offer) || offer <= 0)) return res.status(400).json({ message: 'Enter a valid offer amount' });
  if (!text && offer) text = `Offer: ₹${offer.toLocaleString('en-IN')}`;
  if (!text) return res.status(400).json({ message: 'Message cannot be empty' });
  if (text.length > 1000) return res.status(400).json({ message: 'Message is too long (max 1000 characters)' });

  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  if (!canAccess(inquiry, req)) return res.status(403).json({ message: 'Not your conversation' });
  if (inquiry.status === 'closed') return res.status(400).json({ message: 'This conversation is closed' });

  const sender = req.role === 'horse-seller' ? 'seller' : 'user';
  inquiry.messages.push({ sender, text, kind: offer ? 'offer' : 'text', amount: offer });
  // A new offer replaces any earlier one still waiting for an answer.
  if (offer) inquiry.quote = { amount: offer, by: sender, status: 'pending', at: new Date() };
  inquiry.status = sender === 'seller' ? 'replied' : 'open';
  inquiry.lastMessageAt = new Date();
  await inquiry.save();

  const message = inquiry.messages[inquiry.messages.length - 1];
  const payload = { inquiryId: String(inquiry._id), message };
  const extra = { inquiryId: String(inquiry._id) };

  if (sender === 'seller') {
    notifyOther(req, {
      room: `user:${inquiry.buyer}`,
      role: 'user',
      accountId: inquiry.buyer,
      socketEvent: 'inquiry:message',
      payload,
      title: 'New message from seller',
      body: preview(text),
      type: 'inquiry:message',
      extra,
    });
  } else {
    notifyOther(req, {
      room: `horse-seller:${inquiry.seller}`,
      role: 'horse-seller',
      accountId: inquiry.seller,
      socketEvent: 'inquiry:message',
      payload,
      title: 'New message from a buyer',
      body: preview(text),
      type: 'inquiry:message',
      extra,
    });
  }

  res.status(201).json({ message });
});

// POST /api/marketplace/visits  (user) { horseId, preferredAt, message }
exports.createVisit = asyncHandler(async (req, res) => {
  const { horseId, preferredAt, message } = req.body;
  const horse = await Horse.findById(horseId);
  if (!horse || horse.status !== 'listed') return res.status(404).json({ message: 'Horse not found' });

  const when = new Date(preferredAt);
  if (!preferredAt || Number.isNaN(when.getTime())) return res.status(400).json({ message: 'Pick a valid date and time' });
  if (when.getTime() < Date.now()) return res.status(400).json({ message: 'Pick a time in the future' });

  const visit = await VisitRequest.create({
    horse: horse._id,
    buyer: req.user._id,
    seller: horse.seller,
    preferredAt: when,
    message: message ? String(message).trim().slice(0, 500) : undefined,
  });

  notifyOther(req, {
    room: `horse-seller:${horse.seller}`,
    role: 'horse-seller',
    accountId: horse.seller,
    socketEvent: 'visit:new',
    payload: { visit },
    title: 'New visit request',
    body: `A buyer wants to visit ${horse.name || horse.breed}`,
    type: 'visit:new',
    extra: { visitId: String(visit._id) },
  });

  res.status(201).json({ visit });
});

// GET /api/marketplace/visits/mine  (user)
exports.listMyVisits = asyncHandler(async (req, res) => {
  const visits = await VisitRequest.find({ buyer: req.user._id })
    .populate('horse', HORSE_FIELDS)
    .populate('seller', 'name businessName phone')
    .sort({ createdAt: -1 });
  res.json({ visits });
});

// GET /api/marketplace/visits  (horse-seller)
exports.listSellerVisits = asyncHandler(async (req, res) => {
  const visits = await VisitRequest.find({ seller: req.user._id })
    .populate('horse', HORSE_FIELDS)
    .populate('buyer', 'name phone')
    .sort({ createdAt: -1 });
  res.json({ visits });
});

// PATCH /api/marketplace/visits/:id  (horse-seller) { action: 'accept' | 'decline' }
exports.respondVisit = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!['accept', 'decline'].includes(action)) return res.status(400).json({ message: 'action must be accept or decline' });

  const visit = await VisitRequest.findById(req.params.id);
  if (!visit) return res.status(404).json({ message: 'Visit request not found' });
  if (String(visit.seller) !== String(req.user._id)) return res.status(403).json({ message: 'Not your visit request' });
  if (visit.status !== 'pending') return res.status(400).json({ message: 'This request was already answered' });

  visit.status = action === 'accept' ? 'accepted' : 'declined';
  visit.respondedAt = new Date();
  await visit.save();

  const verb = visit.status === 'accepted' ? 'accepted' : 'declined';
  notifyOther(req, {
    room: `user:${visit.buyer}`,
    role: 'user',
    accountId: visit.buyer,
    socketEvent: 'visit:update',
    payload: { visit },
    title: `Visit request ${verb}`,
    body: `The seller ${verb} your visit request`,
    type: 'visit:update',
    extra: { visitId: String(visit._id) },
  });

  res.json({ visit });
});

// GET /api/marketplace/favourites  (user)
exports.listFavourites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'favouriteHorses',
    match: { status: 'listed' },
    select: 'breed name photos price leaseRate leasePeriod listingType status location',
  });
  res.json({ horses: user?.favouriteHorses || [] });
});

// POST /api/marketplace/favourites/:horseId/toggle  (user)
exports.toggleFavourite = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const id = String(req.params.horseId);
  const exists = user.favouriteHorses.some((h) => String(h) === id);
  if (exists) {
    user.favouriteHorses = user.favouriteHorses.filter((h) => String(h) !== id);
  } else {
    const horse = await Horse.findById(id).select('_id status');
    if (!horse) return res.status(404).json({ message: 'Horse not found' });
    user.favouriteHorses.push(horse._id);
  }
  await user.save();
  res.json({ favourites: user.favouriteHorses.map(String), saved: !exists });
});

// PATCH /api/marketplace/inquiries/:id/quote  (buyer or seller) { action: 'accept' | 'decline' }
// Only the party who did NOT make the pending offer can answer it. Accepting agrees the price in chat.
// No payment is taken here. The two parties call each other to arrange the rest.
exports.decideQuote = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!['accept', 'decline'].includes(action)) return res.status(400).json({ message: 'action must be accept or decline' });

  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  if (!canAccess(inquiry, req)) return res.status(403).json({ message: 'Not your conversation' });
  if (inquiry.status === 'closed') return res.status(400).json({ message: 'This conversation is closed' });

  const responder = req.role === 'horse-seller' ? 'seller' : 'user';
  const quote = inquiry.quote;
  if (!quote || quote.status !== 'pending') return res.status(400).json({ message: 'There is no offer waiting for an answer' });
  if (quote.by === responder) return res.status(400).json({ message: 'You cannot answer your own offer' });

  quote.status = action === 'accept' ? 'accepted' : 'declined';
  const text =
    action === 'accept'
      ? `Offer of ₹${quote.amount.toLocaleString('en-IN')} accepted. Call each other to arrange the rest.`
      : `Offer of ₹${quote.amount.toLocaleString('en-IN')} declined.`;
  if (action === 'accept') inquiry.agreedAmount = quote.amount;
  inquiry.messages.push({ sender: responder, kind: 'deal', amount: quote.amount, text });
  inquiry.lastMessageAt = new Date();
  await inquiry.save();

  const message = inquiry.messages[inquiry.messages.length - 1];
  const payload = { inquiryId: String(inquiry._id), message };
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${inquiry.buyer}`).emit('inquiry:message', payload);
    io.to(`horse-seller:${inquiry.seller}`).emit('inquiry:message', payload);
  }
  res.json({ inquiry });
});
