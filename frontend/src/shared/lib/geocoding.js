const NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
const HEADERS = { Accept: "application/json", "User-Agent": "AshwaIndia-AdminPanel" }

export async function searchPlaces(query) {
  const url = `${NOMINATIM_BASE}/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&q=${encodeURIComponent(
    query
  )}`
  const res = await fetch(url, { headers: HEADERS })
  const json = await res.json()
  if (!Array.isArray(json)) return []
  return json.map((r) => {
    const parts = String(r.display_name || "").split(",").map((p) => p.trim())
    return {
      id: String(r.place_id ?? r.osm_id ?? `${r.lat},${r.lon}`),
      title: parts[0] || r.display_name,
      subtitle: parts.slice(1).join(", ") || r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }
  })
}
