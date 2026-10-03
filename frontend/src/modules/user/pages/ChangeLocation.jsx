import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Crosshair, MapPin, Search } from "lucide-react"
import { searchPlaces } from "@/shared/lib/geocoding"
import { useLocationContext } from "../context/LocationContext"

export default function ChangeLocation() {
  const navigate = useNavigate()
  const { useDeviceLocation, setManualLocation, status, error } = useLocationContext()
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)

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
    setManualLocation({ lat: s.lat, lng: s.lng, label: s.title })
    navigate(-1)
  }

  const handleUseCurrentLocation = async () => {
    if (await useDeviceLocation()) navigate(-1)
  }

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white"
        >
          <ArrowLeft className="h-5 w-5 text-[#0F2238]" />
        </button>
        <h1 className="text-[17px] font-bold text-[#0F2238]">Change Location</h1>
      </div>

      <div className="px-4">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={status === "loading"}
          className="mb-4 flex w-full items-center gap-2 rounded-xl bg-[#F6E9C9] p-4 text-left disabled:opacity-60"
        >
          <Crosshair className="h-[18px] w-[18px] text-[#C28D2E]" />
          <span className="text-sm font-bold text-[#8A6416]">
            {status === "loading" ? "Fetching location..." : "Use current location"}
          </span>
        </button>
        {error && <p className="mb-3 text-[13px] text-destructive">{error}</p>}

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for your area, city..."
            autoFocus
            className="h-12 w-full rounded-xl border border-[#E4E1D8] bg-white pl-[38px] pr-10 text-[15px] text-[#0F2238] outline-none focus:border-[#C28D2E]"
          />
          {searching && <div className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />}
        </div>

        <div className="mt-2">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s)}
              className="flex w-full items-center gap-2 border-b border-[#E4E1D8] px-1 py-2 text-left"
            >
              <MapPin className="h-4 w-4 shrink-0 text-neutral-500" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold text-[#0F2238]">{s.title}</span>
                <span className="block truncate text-[11px] text-neutral-500">{s.subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
