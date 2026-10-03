const Event = require('../models/Event');
const asyncHandler = require('../utils/asyncHandler');
const { EVENT_TYPES } = require('../models/Event');

// Accepts the admin form's fields and returns a clean payload, or an error message.
function parsePayload(body, { partial = false } = {}) {
  const out = {};
  const { title, eventType, description, location, startsAt, endsAt, image, active } = body;

  if (title !== undefined || !partial) {
    if (!title || !String(title).trim()) return { error: 'Title is required' };
    out.title = String(title).trim();
  }
  if (eventType !== undefined) {
    if (!EVENT_TYPES.includes(eventType)) return { error: 'Unknown event type' };
    out.eventType = eventType;
  }
  if (description !== undefined) out.description = String(description).trim();
  if (location !== undefined) out.location = String(location).trim();
  if (startsAt !== undefined || !partial) {
    const start = new Date(startsAt);
    if (!startsAt || Number.isNaN(start.getTime())) return { error: 'A valid start date is required' };
    out.startsAt = start;
  }
  if (endsAt !== undefined) {
    if (!endsAt) {
      out.endsAt = null;
    } else {
      const end = new Date(endsAt);
      if (Number.isNaN(end.getTime())) return { error: 'End date is not valid' };
      if (out.startsAt && end < out.startsAt) return { error: 'End date cannot be before the start date' };
      out.endsAt = end;
    }
  }
  if (image !== undefined) out.image = String(image);
  if (active !== undefined) {
    if (typeof active !== 'boolean') return { error: 'active must be true or false' };
    out.active = active;
  }
  return { payload: out };
}

// GET /api/events — public, active events, latest first
exports.listPublic = asyncHandler(async (req, res) => {
  const events = await Event.find({ active: true }).sort({ startsAt: -1 });
  res.json({ events });
});

// GET /api/events/admin — admin, everything
exports.listAll = asyncHandler(async (req, res) => {
  const events = await Event.find().sort({ startsAt: -1 });
  res.json({ events });
});

exports.create = asyncHandler(async (req, res) => {
  const { error, payload } = parsePayload(req.body);
  if (error) return res.status(400).json({ message: error });
  const event = await Event.create(payload);
  res.status(201).json({ event });
});

exports.update = asyncHandler(async (req, res) => {
  const { error, payload } = parsePayload(req.body, { partial: true });
  if (error) return res.status(400).json({ message: error });
  const event = await Event.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json({ event });
});

exports.remove = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json({ ok: true });
});
