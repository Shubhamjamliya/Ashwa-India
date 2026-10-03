import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Crosshair, MapPin, Search, Truck } from "lucide-react"
import { searchPlaces, reverseGeocode, getCurrentPosition } from "@/shared/lib/geocoding"
import PageHeader from "../components/PageHeader"

function LocationField({ label, placeholder, value, onSelect, onClear, allowCurrentLocation }) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setSuggestions([])
      return
    }
    setSearching(true)
    const t = setTimeout(() => {
      searchPlaces(q)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setSearching(false))
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  const pick = (s) => {
    onSelect({ address: s.title, lat: s.lat, lng: s.lng })
    setQuery("")
    setSuggestions([])
  }

  const useCurrentLocation = async () => {
    setLocating(true)
    setError("")
    try {
      const { lat, lng } = await getCurrentPosition()
      const place = await reverseGeocode(lat, lng)
      onSelect({ address: place?.formatted || place?.line1 || "Current location", lat, lng })
    } catch (err) {
      setError(err.message)
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="mb-4">
      <p className="mb-1.5 text-[13px] font-bold text-[#0F2238]">{label}</p>
      {value ? (
        <button
          type="button"
          onClick={onClear}
          className="flex w-full items-center gap-2.5 rounded-xl border border-[#E4E1D8] bg-white px-3.5 py-3 text-left"
        >
          <MapPin className="h-4 w-4 shrink-0 text-[#C28D2E]" />
          <span className="flex-1 truncate text-[13px] font-semibold text-[#0F2238]">{value.address}</span>
          <span className="text-xs font-bold text-[#C28D2E]">Change</span>
        </button>
      ) : (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="h-11 w-full rounded-xl border border-[#E4E1D8] bg-white pl-10 pr-10 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
          />
          {searching && <div className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />}
        </div>
      )}

      {!value && allowCurrentLocation && (
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#C28D2E] disabled:opacity-60"
        >
          {locating ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /> : <Crosshair className="h-3.5 w-3.5" />}
          {locating ? "Locating..." : "Use current location"}
        </button>
      )}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}

      {!value && query.trim().length >= 3 && suggestions.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-xl border border-[#E4E1D8] bg-white">
          {suggestions.map((s) => (
            <button key={s.id} type="button" onClick={() => pick(s)} className="flex w-full items-start gap-2 border-b border-[#E4E1D8] px-3 py-2.5 text-left last:border-0">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-[#0F2238]">{s.title}</span>
                <span className="block truncate text-[10px] text-neutral-500">{s.subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Transport() {
  const navigate = useNavigate()
  const [source, setSource] = useState(null)
  const [destination, setDestination] = useState(null)

  const findTransport = () => {
    if (!source || !destination) return
    const query = new URLSearchParams({ src: JSON.stringify(source), dst: JSON.stringify(destination) })
    navigate(`/user/transport/results?${query}`)
  }

  return (
    <div className="pb-6">
      <PageHeader title="Horse Transport" titleClassName="text-[17px]" />

      <div className="px-4">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6E9C9]">
          <Truck className="h-7 w-7 text-[#C28D2E]" />
        </div>
        <p className="mb-5 text-sm text-neutral-500">Where are you moving your horse from and to?</p>

        <LocationField
          label="Pickup location"
          placeholder="Search pickup location..."
          value={source}
          onSelect={setSource}
          onClear={() => setSource(null)}
          allowCurrentLocation
        />
        <LocationField
          label="Drop-off location"
          placeholder="Search drop-off location..."
          value={destination}
          onSelect={setDestination}
          onClear={() => setDestination(null)}
        />

        <button
          onClick={findTransport}
          disabled={!source || !destination}
          className="mt-2 w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Find Available Transport
        </button>
      </div>
    </div>
  )
}
