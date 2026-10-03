const Zone = require('../models/Zone');
const asyncHandler = require('../utils/asyncHandler');

const MIN_POINTS = 3;

function validatePolygon(polygon) {
  if (!polygon || !Array.isArray(polygon.coordinates) || polygon.coordinates.length === 0) {
    return 'polygon.coordinates is required';
  }
  const ring = polygon.coordinates[0];
  if (!Array.isArray(ring) || ring.length < MIN_POINTS + 1) {
    return `polygon needs at least ${MIN_POINTS} points (closed ring)`;
  }
  const [firstLng, firstLat] = ring[0];
  const [lastLng, lastLat] = ring[ring.length - 1];
  if (firstLng !== lastLng || firstLat !== lastLat) {
    return 'polygon ring must be closed (first and last point must match)';
  }
  return null;
}

// GET /api/zones  (admin)
exports.list = asyncHandler(async (req, res) => {
  const zones = await Zone.find().sort({ createdAt: -1 });
  res.json({ zones });
});

exports.getById = asyncHandler(async (req, res) => {
  const zone = await Zone.findById(req.params.id);
  if (!zone) return res.status(404).json({ message: 'Zone not found' });
  res.json({ zone });
});

// POST /api/zones  (admin)
exports.create = asyncHandler(async (req, res) => {
  const { name, country, serviceLocation, unit, color, isActive, polygon } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });

  const polygonError = validatePolygon(polygon);
  if (polygonError) return res.status(400).json({ message: polygonError });

  const zone = await Zone.create({ name, country, serviceLocation, unit, color, isActive, polygon });
  res.status(201).json({ zone });
});

// PATCH /api/zones/:id  (admin)
exports.update = asyncHandler(async (req, res) => {
  const { name, country, serviceLocation, unit, color, isActive, polygon } = req.body;

  if (polygon) {
    const polygonError = validatePolygon(polygon);
    if (polygonError) return res.status(400).json({ message: polygonError });
  }

  const zone = await Zone.findByIdAndUpdate(
    req.params.id,
    { name, country, serviceLocation, unit, color, isActive, polygon },
    { new: true, omitUndefined: true }
  );
  if (!zone) return res.status(404).json({ message: 'Zone not found' });
  res.json({ zone });
});

// DELETE /api/zones/:id  (admin)
exports.remove = asyncHandler(async (req, res) => {
  const zone = await Zone.findByIdAndDelete(req.params.id);
  if (!zone) return res.status(404).json({ message: 'Zone not found' });
  res.json({ message: 'Zone deleted' });
});

// GET /api/zones/check?lat=&lng=  (public — every app calls this before use)
exports.checkPoint = asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ message: 'lat and lng are required' });
  }

  const zone = await Zone.findOne({
    isActive: true,
    polygon: {
      $geoIntersects: { $geometry: { type: 'Point', coordinates: [lng, lat] } },
    },
  });

  res.json({ inZone: Boolean(zone), zone: zone ? { id: zone._id, name: zone.name } : null });
});

// GET /api/zones/active — public, names only (no polygons). Providers pick their service area from these.
exports.listActivePublic = asyncHandler(async (req, res) => {
  const zones = await Zone.find({ isActive: true }).select('name serviceLocation').sort({ name: 1 });
  res.json({ zones: zones.map((z) => ({ id: z._id, name: z.name, serviceLocation: z.serviceLocation })) });
});

// Zones that contain a point — used to decide which providers serve a user's location.
exports.zonesContaining = async (lat, lng) =>
  Zone.find({
    isActive: true,
    polygon: { $geoIntersects: { $geometry: { type: 'Point', coordinates: [lng, lat] } } },
  }).select('_id');
