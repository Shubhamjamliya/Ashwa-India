import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Briefcase, ChevronRight, Crosshair, Home as HomeIcon, MapPin, Plus, Search, X } from "lucide-react"
import { searchPlaces, reverseGeocode, getCurrentPosition } from "@/shared/lib/geocoding"
import { useAddresses } from "../context/AddressContext"

function addressIcon(label = "") {
  const l = label.toLowerCase()
  if (l.includes("work") || l.includes("office")) return Briefcase
  if (l.includes("home")) return HomeIcon
  return MapPin
}

export default function SelectAddress() {
  const navigate = useNavigate()
  const { addresses, selectAddress } = useAddresses()
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

  const handleSelectSaved = (address) => {
    selectAddress(address.id)
    navigate(-1)
  }

  const openForm = (preset) => navigate("/user/addresses/new", { state: { ...preset, selectOnSave: true } })

  const handleSelectSuggestion = (s) =>
    openForm({
      presetLat: s.lat,
      presetLng: s.lng,
      presetLine1: s.line1,
      presetCity: s.city,
      presetState: s.state,
      presetPincode: s.pincode,
    })

  const handleUseCurrentLocation = async () => {
    setLocating(true)
    setError("")
    try {
      const { lat, lng } = await getCurrentPosition()
      const place = await reverseGeocode(lat, lng)
      openForm({
        presetLat: lat,
        presetLng: lng,
        presetLine1: place?.line1,
        presetCity: place?.city,
        presetState: place?.state,
        presetPincode: place?.pincode,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <button onClick={() => navigate(-1)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
          <X className="h-5 w-5 text-[#0F2238]" />
        </button>
        <h1 className="text-[17px] font-bold text-[#0F2238]">Select delivery address</h1>
      </div>

      <div className="px-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#C28D2E]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search area, street, landmark..."
            className="h-11 w-full rounded-xl border border-[#E4E1D8] bg-white pl-10 pr-10 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
          />
          {searching && <div className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />}
        </div>

        {suggestions.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSuggestion(s)}
                className="flex w-full items-start gap-3 border-b border-[#E4E1D8] px-4 py-3 text-left last:border-0"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold text-[#0F2238]">{s.title}</span>
                  <span className="block truncate text-[11px] text-neutral-500">{s.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
          <button
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className="flex w-full items-center gap-3 border-b border-[#E4E1D8] px-4 py-3.5 text-left disabled:opacity-60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6E9C9]">
              {locating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /> : <Crosshair className="h-[18px] w-[18px] text-[#C28D2E]" />}
            </span>
            <span className="flex-1 text-sm font-bold text-[#C28D2E]">{locating ? "Fetching location..." : "Use current location"}</span>
            <ChevronRight className="h-4 w-4 text-neutral-500" />
          </button>
          <button onClick={() => openForm({})} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6E9C9]">
              <Plus className="h-[18px] w-[18px] text-[#C28D2E]" />
            </span>
            <span className="flex-1 text-sm font-bold text-[#C28D2E]">Enter address manually</span>
            <ChevronRight className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        {error && <p className="mt-3 text-[13px] text-destructive">{error}</p>}

        <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-neutral-500">Saved Addresses</p>
        {addresses.length === 0 ? (
          <p className="text-[13px] text-neutral-500">No addresses saved yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
            {addresses.map((address, index) => {
              const Icon = addressIcon(address.label)
              return (
                <button
                  key={address.id}
                  onClick={() => handleSelectSaved(address)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${index !== addresses.length - 1 ? "border-b border-[#E4E1D8]" : ""}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6E9C9]">
                    <Icon className="h-[18px] w-[18px] text-[#C28D2E]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-[#0F2238]">{address.label}</span>
                    <span className="block line-clamp-2 text-[11px] text-neutral-500">
                      {[address.line1, address.city, address.state, address.pincode].filter(Boolean).join(", ")}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-neutral-500" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
