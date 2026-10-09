// Road routes between two points from the Google Directions API, used to match shared rides
// along the way (e.g. Indore → Dewas fits a vehicle going Indore → Bhopal).

const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';
const TIMEOUT_MS = 8000;
// After a failed call, don't retry the same pair for a while, so searches stay fast.
const RETRY_AFTER_MS = 10 * 60 * 1000;
const failedAt = new Map();

const pairKey = (a, b) => `${a.lat.toFixed(5)},${a.lng.toFixed(5)}|${b.lat.toFixed(5)},${b.lng.toFixed(5)}`;

// Resolves to Google's encoded overview polyline for the driving route, or null when unavailable
// (no key, API not enabled, key restricted to browsers, network error).
async function fetchRoutePolyline(from, to) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const k = pairKey(from, to);
  if (failedAt.has(k) && Date.now() - failedAt.get(k) < RETRY_AFTER_MS) return null;

  const url = `${DIRECTIONS_URL}?origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&mode=driving&key=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const json = await res.json();
    const points = json?.routes?.[0]?.overview_polyline?.points;
    if (json.status === 'OK' && points) {
      failedAt.delete(k);
      return points;
    }
    console.warn(`[roadRoute] Directions returned ${json.status}${json.error_message ? `: ${json.error_message}` : ''}`);
  } catch (err) {
    console.warn(`[roadRoute] Directions request failed: ${err.message}`);
  }
  failedAt.set(k, Date.now());
  return null;
}

module.exports = { fetchRoutePolyline };
