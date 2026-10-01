const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const HEADERS = { Accept: 'application/json', 'User-Agent': 'AshwaIndia-UserApp' };

export type PlaceSuggestion = {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

export type ReverseGeocodeResult = {
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  formatted?: string;
};

function pickCity(addr: any): string | undefined {
  return addr.city || addr.town || addr.village || addr.municipality || addr.county;
}

function pickLine1(addr: any, fallback?: string): string | undefined {
  const parts = [addr.road, addr.suburb, addr.neighbourhood, addr.house_number].filter(Boolean);
  if (parts.length) return parts.slice(0, 2).join(', ');
  return fallback;
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const url = `${NOMINATIM_BASE}/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=in&q=${encodeURIComponent(
    query,
  )}`;
  const res = await fetch(url, { headers: HEADERS });
  const json = await res.json();
  if (!Array.isArray(json)) return [];
  return json.map((r: any) => {
    const addr = r.address || {};
    const displayParts = String(r.display_name || '').split(',').map((p: string) => p.trim());
    return {
      id: String(r.place_id ?? r.osm_id ?? `${r.lat},${r.lon}`),
      title: displayParts[0] || r.display_name,
      subtitle: displayParts.slice(1).join(', ') || r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
      line1: pickLine1(addr, displayParts[0]),
      city: pickCity(addr),
      state: addr.state,
      pincode: addr.postcode,
    };
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  try {
    const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: HEADERS });
    const json: any = await res.json();
    if (!json || !json.address) return null;
    const addr = json.address;
    return {
      line1: pickLine1(addr, String(json.display_name || '').split(',')[0]),
      city: pickCity(addr),
      state: addr.state,
      pincode: addr.postcode,
      formatted: json.display_name,
    };
  } catch {
    return null;
  }
}

export function staticMapUrl(lat: number, lng: number, width = 640, height = 280, zoom = 16) {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lng},red-pushpin`;
}
