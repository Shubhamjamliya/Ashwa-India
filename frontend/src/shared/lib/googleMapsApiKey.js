// Google Maps API Key utility — build-time env only, no backend call.
let cachedApiKey = null

function sanitizeApiKey(value) {
  if (!value) return ""
  return String(value).trim().replace(/^['"]|['"]$/g, "")
}

export async function getGoogleMapsApiKey() {
  if (cachedApiKey) return cachedApiKey
  cachedApiKey = sanitizeApiKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
  return cachedApiKey
}
