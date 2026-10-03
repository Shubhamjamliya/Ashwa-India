const NOMINATIM_BASE = "https://nominatim.openstreetmap.org"

function pickCity(addr) {
  return addr.city || addr.town || addr.village || addr.municipality || addr.county
}

function pickLine1(addr, fallback) {
  const parts = [addr.road, addr.suburb, addr.neighbourhood, addr.house_number].filter(Boolean)
  if (parts.length) return parts.slice(0, 2).join(", ")
  return fallback
}

export async function searchPlaces(query) {
  const url = `${NOMINATIM_BASE}/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=in&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { Accept: "application/json" } })
  const json = await res.json()
  if (!Array.isArray(json)) return []
  return json.map((r) => {
    const addr = r.address || {}
    const displayParts = String(r.display_name || "").split(",").map((p) => p.trim())
    return {
      id: String(r.place_id ?? r.osm_id ?? `${r.lat},${r.lon}`),
      title: displayParts[0] || r.display_name,
      subtitle: displayParts.slice(1).join(", ") || r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
      line1: pickLine1(addr, displayParts[0]),
      city: pickCity(addr),
      state: addr.state,
      pincode: addr.postcode,
    }
  })
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
      headers: { Accept: "application/json" },
    })
    const json = await res.json()
    if (!json || !json.address) return null
    const addr = json.address
    return {
      line1: pickLine1(addr, String(json.display_name || "").split(",")[0]),
      city: pickCity(addr),
      state: addr.state,
      pincode: addr.postcode,
      formatted: json.display_name,
    }
  } catch {
    return null
  }
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported in this browser"))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Could not get your location. Allow location access and try again.")),
      { enableHighAccuracy: true, timeout: 15000 }
    )
  })
}
