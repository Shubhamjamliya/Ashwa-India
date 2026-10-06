import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { ArrowDownUp, Crosshair, LocateFixed, MapPin, X } from "lucide-react"
import { getGoogleMapsApiKey } from "@/shared/lib/googleMapsApiKey"
import { distanceKm } from "@/shared/lib/geo"

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 } // India, until a point is set or the device is located

// Pulls the parts an address form needs out of a Google geocode result.
function parsePlace(result, lat, lng) {
  const parts = Object.fromEntries((result.address_components || []).flatMap((c) => c.types.map((t) => [t, c.long_name])))
  const line1 = [parts.street_number, parts.route || parts.sublocality_level_1 || parts.neighborhood].filter(Boolean).join(", ")
  return {
    address: result.formatted_address,
    line1: line1 || result.formatted_address.split(",")[0],
    city: parts.locality || parts.administrative_area_level_2 || "",
    state: parts.administrative_area_level_1 || "",
    pincode: parts.postal_code || "",
    lat,
    lng,
  }
}

// Three cards: the route (pickup and drop-off), the map, and the trip summary.
// value: { source, destination }, onChange({ source, destination }), onContinue() when the user is ready.
export default function LocationPicker({ value, onChange, onContinue }) {
  const pickupInputRef = useRef(null)
  const dropInputRef = useRef(null)
  const mapDivRef = useRef(null)
  const mapRef = useRef(null)
  const geocoderRef = useRef(null)
  const markersRef = useRef({})
  const lineRef = useRef(null)
  const googleRef = useRef(null)
  const activeRef = useRef("source")
  const valueRef = useRef(value)
  valueRef.current = value

  const [ready, setReady] = useState(false)
  const [keyMissing, setKeyMissing] = useState(false)
  const [active, setActive] = useState("source")
  const [texts, setTexts] = useState({ source: value.source?.address || "", destination: value.destination?.address || "" })
  const [resolving, setResolving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState("")

  const setPoint = (field, point) => onChange({ ...valueRef.current, [field]: point })

  useEffect(() => {
    activeRef.current = active
  }, [active])

  // Moves the chosen field's pin to a point and fills in its address.
  const pinAt = (field, lat, lng) => {
    setResolving(true)
    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      setResolving(false)
      const point =
        status === "OK" && results?.[0]
          ? parsePlace(results[0], lat, lng)
          : { address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, line1: "Pinned location", city: "", state: "", pincode: "", lat, lng }
      setTexts((t) => ({ ...t, [field]: point.address }))
      setPoint(field, point)
    })
  }

  // Load Google once, then wire the map and both search boxes.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const apiKey = await getGoogleMapsApiKey()
      if (!apiKey) {
        setKeyMissing(true)
        return
      }
      const google = await new Loader({ apiKey, version: "weekly", libraries: ["places"] }).load()
      if (cancelled) return
      googleRef.current = google

      const start = valueRef.current.source || valueRef.current.destination
      const map = new google.maps.Map(mapDivRef.current, {
        center: start ? { lat: start.lat, lng: start.lng } : DEFAULT_CENTER,
        zoom: start ? 16 : 5,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
      })
      mapRef.current = map
      geocoderRef.current = new google.maps.Geocoder()

      // Each search box suggests Indian places and sets its own field when a suggestion is picked.
      for (const [field, ref] of [
        ["source", pickupInputRef],
        ["destination", dropInputRef],
      ]) {
        const autocomplete = new google.maps.places.Autocomplete(ref.current, {
          componentRestrictions: { country: "in" },
          fields: ["geometry", "formatted_address", "address_components"],
        })
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace()
          if (!place.geometry?.location) return
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          setTexts((t) => ({ ...t, [field]: place.formatted_address || ref.current.value }))
          setPoint(field, parsePlace({ address_components: place.address_components, formatted_address: place.formatted_address }, lat, lng))
          setActive(field === "source" ? "destination" : "source")
          map.panTo(place.geometry.location)
          map.setZoom(16)
        })
      }

      // Only the user dragging the map moves a pin. Google does not fire dragend for programmatic pans.
      map.addListener("dragend", () => {
        const c = map.getCenter()
        pinAt(activeRef.current, c.lat(), c.lng())
      })

      setReady(true)
    })().catch((err) => setError(err.message || "Could not load Google Maps"))

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Markers and the line between the two points follow the chosen points.
  useEffect(() => {
    const google = googleRef.current
    const map = mapRef.current
    if (!ready || !google || !map) return
    const style = {
      source: { fill: "#10B981", label: "A" },
      destination: { fill: "#F43F5E", label: "B" },
    }
    for (const field of ["source", "destination"]) {
      const point = value[field]
      if (!point) {
        markersRef.current[field]?.setMap(null)
        delete markersRef.current[field]
        continue
      }
      const position = { lat: point.lat, lng: point.lng }
      if (!markersRef.current[field]) {
        markersRef.current[field] = new google.maps.Marker({
          map,
          position,
          label: { text: style[field].label, color: "#fff", fontWeight: "bold" },
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: style[field].fill, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
        })
      } else {
        markersRef.current[field].setPosition(position)
      }
    }
    lineRef.current?.setMap(null)
    lineRef.current = null
    if (value.source && value.destination) {
      lineRef.current = new google.maps.Polyline({
        map,
        path: [
          { lat: value.source.lat, lng: value.source.lng },
          { lat: value.destination.lat, lng: value.destination.lng },
        ],
        strokeColor: "#0B1C33",
        strokeOpacity: 0.7,
        strokeWeight: 3,
      })
      const bounds = new google.maps.LatLngBounds()
      bounds.extend({ lat: value.source.lat, lng: value.source.lng })
      bounds.extend({ lat: value.destination.lat, lng: value.destination.lng })
      map.fitBounds(bounds, 60)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.source?.lat, value.source?.lng, value.destination?.lat, value.destination?.lng, ready])

  // Choosing a field moves the map to that field's point, if it has one.
  const choose = (field) => {
    setActive(field)
    const point = valueRef.current[field]
    if (point && mapRef.current) mapRef.current.panTo({ lat: point.lat, lng: point.lng })
  }

  // The × button empties one field and removes its pin.
  const clearField = (field) => {
    setTexts((t) => ({ ...t, [field]: "" }))
    setPoint(field, null)
    setActive(field)
  }

  const swap = () => {
    const { source, destination } = valueRef.current
    setTexts((t) => ({ source: t.destination, destination: t.source }))
    onChange({ source: destination, destination: source })
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return setError("This device does not share its location")
    setLocating(true)
    setError("")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const { latitude: lat, longitude: lng } = pos.coords
        mapRef.current?.panTo({ lat, lng })
        mapRef.current?.setZoom(16)
        // The user asked for their location, so the chosen pin takes it.
        pinAt(activeRef.current, lat, lng)
      },
      () => {
        setLocating(false)
        setError("Allow location access, or search for the place")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  if (keyMissing) {
    return <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Google Maps is not set up. Add VITE_GOOGLE_MAPS_API_KEY to the frontend environment file.</p>
  }

  const { source, destination } = value
  const km = source && destination ? distanceKm(source, destination) : null
  const inputClass = (field) =>
    `h-12 w-full rounded-xl border bg-[#FAF7F1] pl-10 pr-10 text-sm font-medium text-[#0F2238] outline-none placeholder:text-neutral-400 ${
      active === field ? "border-[#C28D2E] bg-white ring-2 ring-[#C28D2E]/20" : "border-transparent"
    }`

  const ClearButton = ({ field }) =>
    texts[field] ? (
      <button
        type="button"
        onClick={() => clearField(field)}
        aria-label={`Clear ${field === "source" ? "pickup" : "drop-off"}`}
        className="absolute right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    ) : null

  return (
    <div className="space-y-4">
      {/* Card 1: route */}
      <section className="rounded-2xl border border-[#E4E1D8] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-[#0F2238]">Route</p>
          <button type="button" onClick={swap} disabled={!source && !destination} className="flex items-center gap-1 text-xs font-bold text-[#C28D2E] disabled:opacity-40">
            <ArrowDownUp className="h-3.5 w-3.5" /> Swap
          </button>
        </div>
        <div className="relative space-y-2.5">
          <span className="absolute left-[1.15rem] top-6 bottom-6 w-px border-l-2 border-dotted border-neutral-300" />
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-emerald-500 bg-white" />
            <input
              ref={pickupInputRef}
              value={texts.source}
              onFocus={() => choose("source")}
              onChange={(e) => setTexts((t) => ({ ...t, source: e.target.value }))}
              placeholder="Pickup location"
              className={inputClass("source")}
            />
            <ClearButton field="source" />
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full bg-rose-500" />
            <input
              ref={dropInputRef}
              value={texts.destination}
              onFocus={() => choose("destination")}
              onChange={(e) => setTexts((t) => ({ ...t, destination: e.target.value }))}
              placeholder="Drop-off location"
              className={inputClass("destination")}
            />
            <ClearButton field="destination" />
          </div>
        </div>
      </section>

      {/* Card 2: map */}
      <section className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3">
          <p className="text-sm font-bold text-[#0F2238]">Pin on map</p>
          <div className="ml-auto flex rounded-full bg-[#F1EEE6] p-0.5">
            {[
              ["source", "Pickup"],
              ["destination", "Drop-off"],
            ].map(([field, label]) => (
              <button
                key={field}
                type="button"
                onClick={() => choose(field)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${active === field ? "bg-[#0B1C33] text-white shadow" : "text-neutral-600"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative h-[320px] bg-neutral-100">
          <div ref={mapDivRef} className="h-full w-full" />
          {!ready && !error && <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">Loading map...</div>}
          {/* Fixed pin in the middle. Its tip marks the spot for the chosen field. */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
            <MapPin className={`h-10 w-10 drop-shadow-md ${active === "source" ? "fill-emerald-500 text-emerald-700" : "fill-rose-500 text-rose-700"}`} />
          </div>
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={!ready || locating}
            aria-label="Use my current location"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg disabled:opacity-50"
          >
            {locating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /> : <LocateFixed className="h-5 w-5 text-[#0B1C33]" />}
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 text-[11px] text-neutral-500">
          <Crosshair className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {resolving ? "Finding address..." : ready ? `Drag the map to move the ${active === "source" ? "pickup" : "drop-off"} pin` : "Loading map..."}
          </span>
        </div>
        {error && <p className="px-4 pb-3 text-xs text-destructive">{error}</p>}
      </section>

      {/* Card 3: trip summary and continue */}
      <section className="rounded-2xl border border-[#E4E1D8] bg-white p-4 shadow-sm">
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#FAF7F1] p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Distance</p>
            <p className="mt-0.5 text-lg font-extrabold text-[#0F2238]">{km != null ? `${km.toFixed(1)} km` : "—"}</p>
            <p className="text-[10px] text-neutral-500">Straight line</p>
          </div>
          <div className="rounded-xl bg-[#FAF7F1] p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Price</p>
            <p className="mt-0.5 text-lg font-extrabold text-[#0F2238]">Shown next</p>
            <p className="text-[10px] text-neutral-500">Per km, from each transporter</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onContinue}
          disabled={!source || !destination}
          className="h-12 w-full rounded-2xl bg-[#C28D2E] text-sm font-bold text-white shadow-md disabled:opacity-50"
        >
          Find available transport
        </button>
      </section>
    </div>
  )
}
