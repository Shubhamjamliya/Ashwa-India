// Geometry on a route given as a list of { lat, lng } points.

const KM_PER_DEG_LAT = 111.32;

// Google's encoded polyline format → [{ lat, lng }].
function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (const axis of ['lat', 'lng']) {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 'lat') lat += delta;
      else lng += delta;
    }
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// Flat x/y in km around a reference latitude. Accurate enough at the scale of one trip.
function projector(refLat) {
  const kmPerDegLng = KM_PER_DEG_LAT * Math.cos((refLat * Math.PI) / 180);
  return (p) => ({ x: p.lng * kmPerDegLng, y: p.lat * KM_PER_DEG_LAT });
}

// Where `point` sits relative to `path`:
// offKm   — distance from the point to the nearest spot on the path,
// alongKm — how far along the path (from its start) that nearest spot is.
function locateOnPath(path, point) {
  if (!path || path.length === 0) return { offKm: Infinity, alongKm: 0 };
  const project = projector(point.lat);
  const p = project(point);
  if (path.length === 1) {
    const a = project(path[0]);
    return { offKm: Math.hypot(p.x - a.x, p.y - a.y), alongKm: 0 };
  }
  let best = { offKm: Infinity, alongKm: 0 };
  let travelled = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const a = project(path[i]);
    const b = project(path[i + 1]);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segKm = Math.hypot(dx, dy);
    const t = segKm === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (segKm * segKm)));
    const off = Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
    if (off < best.offKm) best = { offKm: off, alongKm: travelled + t * segKm };
    travelled += segKm;
  }
  return best;
}

function pathLengthKm(path) {
  if (!path || path.length < 2) return 0;
  const project = projector(path[0].lat);
  let total = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const a = project(path[i]);
    const b = project(path[i + 1]);
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}

module.exports = { decodePolyline, locateOnPath, pathLengthKm };
