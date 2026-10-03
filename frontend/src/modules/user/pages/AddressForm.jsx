import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Crosshair, MapPin, Search } from "lucide-react"
import { searchPlaces, reverseGeocode, getCurrentPosition } from "@/shared/lib/geocoding"
import { useAddresses } from "../context/AddressContext"
import PageHeader from "../components/PageHeader"

const LABELS = ["Home", "Work", "Other"]

function staticMapUrl(lat, lng) {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=16&size=640x280&markers=${lat},${lng},red-pushpin`
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[#0F2238]">{label}</label>
      <input
        {...props}
        className="h-11 w-full rounded-xl border border-[#E4E1D8] bg-white px-3 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
      />
    </div>
  )
}

export default function AddressForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { editId } = useParams()
  const preset = location.state || {}
  const { addresses, addAddress, updateAddress, selectAddress } = useAddresses()
  const editing = editId ? addresses.find((a) => a.id === editId) : undefined

  const [label, setLabel] = useState(editing?.label || "Home")
  const [line1, setLine1] = useState(editing?.line1 || preset.presetLine1 || "")
  const [city, setCity] = useState(editing?.city || preset.presetCity || "")
  const [state, setState] = useState(editing?.state || preset.presetState || "")
  const [pincode, setPincode] = useState(editing?.pincode || preset.presetPincode || "")
  const [lat, setLat] = useState(editing?.lat ?? preset.presetLat)
  const [lng, setLng] = useState(editing?.lng ?? preset.presetLng)
  const [locating, setLocating] = useState(false)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
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

  const applySuggestion = (s) => {
    setLat(s.lat)
    setLng(s.lng)
    if (s.line1) setLine1(s.line1)
    if (s.city) setCity(s.city)
    if (s.state) setState(s.state)
    if (s.pincode) setPincode(s.pincode)
    setQuery("")
    setSuggestions([])
  }

  const handleUseCurrentLocation = async () => {
    setLocating(true)
    setError("")
    try {
      const pos = await getCurrentPosition()
      setLat(pos.lat)
      setLng(pos.lng)
      const place = await reverseGeocode(pos.lat, pos.lng)
      if (place) {
        if (place.line1) setLine1(place.line1)
        if (place.city) setCity(place.city)
        if (place.state) setState(place.state)
        if (place.pincode) setPincode(place.pincode)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLocating(false)
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!line1.trim() || !city.trim()) {
      setError("Address line and city are required")
      return
    }
    const payload = { label, line1: line1.trim(), city: city.trim(), state: state.trim(), pincode: pincode.trim(), lat, lng }
    if (editing) {
      updateAddress(editing.id, payload)
      if (preset.selectOnSave) selectAddress(editing.id)
    } else {
      const created = addAddress(payload)
      if (preset.selectOnSave) selectAddress(created.id)
    }
    navigate(preset.selectOnSave ? "/user/checkout" : "/user/addresses", { replace: true })
  }

  return (
    <div className="pb-8">
      <PageHeader title={editing ? "Edit Address" : "Add Address"} />

      <form onSubmit={handleSave} className="space-y-4 px-4">
        <div className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
          <div className="relative h-[140px] w-full bg-[#F1EEE6]">
            {lat != null && lng != null ? (
              <img src={staticMapUrl(lat, lng)} alt="Pinned location" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <MapPin className="h-6 w-6 text-neutral-500" />
                <p className="text-xs text-neutral-500">Search or use current location to pin a spot</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className="flex w-full items-center justify-center gap-1.5 py-3 text-xs font-bold text-[#C28D2E] disabled:opacity-60"
          >
            <Crosshair className="h-4 w-4" />
            {locating ? "Locating..." : "Use current location"}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C28D2E]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search to update pinned location..."
            className="h-11 w-full rounded-xl border border-[#E4E1D8] bg-white pl-10 pr-10 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
          />
          {searching && <div className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />}
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-[#E4E1D8] bg-white shadow-lg">
              {suggestions.map((s) => (
                <button key={s.id} type="button" onClick={() => applySuggestion(s)} className="flex w-full items-start gap-2 border-b border-[#E4E1D8] px-3 py-2.5 text-left last:border-0">
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

        <Field label="Address Line *" value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="House no., street, area" />
        <div className="grid grid-cols-3 gap-2">
          <Field label="City *" value={city} onChange={(e) => setCity(e.target.value)} />
          <Field label="State" value={state} onChange={(e) => setState(e.target.value)} />
          <Field
            label="Pincode"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-[#0F2238]">Save address as</p>
          <div className="flex gap-2">
            {LABELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLabel(l)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-bold ${
                  label === l ? "border-[#C28D2E] bg-[#F6E9C9] text-[#8A6416]" : "border-[#E4E1D8] bg-white text-neutral-600"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        <button type="submit" className="w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white">
          {editing ? "Update Address" : "Save Address"}
        </button>
      </form>
    </div>
  )
}
