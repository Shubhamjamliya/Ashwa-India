import { useEffect, useRef, useState } from "react"
import { ArrowDownUp, LocateFixed, MapPin, Navigation, X } from "lucide-react"
import { loadGoogleMaps } from "@/shared/lib/googleMaps"
import { distanceKm } from "@/shared/lib/geo"

// Used only until the device location arrives (or if the user blocks it).
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }
const STREET_ZOOM = 17

const FIELD = {
  source: { label: "Pickup", fill: "#10B981", dark: "#047857" },
  destination: { label: "Drop-off", fill: "#F43F5E", dark: "#BE123C" },
}

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

function locate() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("This device does not share its location"))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Allow location access, or search for the place")),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}

// Ride-app style picker on Google Maps.
// "pin" mode: the map is centred on the field being set and a fixed pin marks it; dragging the map moves it.
// "route" mode: once both points are set, both markers and the line between them are shown.
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
  const modeRef = useRef("pin")
  const valueRef = useRef(value)
  valueRef.current = value

  const [ready, setReady] = useState(false)
  const [keyMissing, setKeyMissing] = useState(false)
  const [active, setActive] = useState("source")
  const [mode, setMode] = useState(value.source && value.destination ? "route" : "pin")
  const [dragging, setDragging] = useState(false)
  const [texts, setTexts] = useState({ source: value.source?.address || "", destination: value.destination?.address || "" })
  const [resolving, setResolving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState("")

  activeRef.current = active
  modeRef.current = mode

  const setPoint = (field, point) => {
    const next = { ...valueRef.current, [field]: point }
    valueRef.current = next
    onChange(next)
  }

  // Fills a field from a map position, using Google's address for it.
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

  // Centres the map on a field so its pin can be moved.
  const focusField = (field) => {
    setActive(field)
    setMode("pin")
    const point = valueRef.current[field]
    const map = mapRef.current
    if (point && map) {
      map.panTo({ lat: point.lat, lng: point.lng })
      map.setZoom(STREET_ZOOM)
    }
  }

  // After a field is set: go to the empty one, or show the whole route when both are set.
  const afterSet = (field) => {
    const other = field === "source" ? "destination" : "source"
    if (valueRef.current[other]) {
      setMode("route")
    } else {
      setActive(other)
      setTimeout(() => (other === "destination" ? dropInputRef : pickupInputRef).current?.focus(), 0)
    }
  }

  const useCurrentLocation = async (field = "source", { silent = false } = {}) => {
    setLocating(true)
    if (!silent) setError("")
    try {
      const { lat, lng } = await locate()
      setActive(field)
      setMode("pin")
      mapRef.current?.panTo({ lat, lng })
      mapRef.current?.setZoom(STREET_ZOOM)
      pinAt(field, lat, lng)
      if (!silent) afterSet(field)
    } catch (err) {
      if (!silent) setError(err.message)
    } finally {
      setLocating(false)
    }
  }

  // Load Google once, then wire the map and both search boxes.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const google = await loadGoogleMaps()
      if (!google) {
        setKeyMissing(true)
        return
      }
      if (cancelled) return
      googleRef.current = google

      const start = valueRef.current.source || valueRef.current.destination
      const map = new google.maps.Map(mapDivRef.current, {
        center: start ? { lat: start.lat, lng: start.lng } : DEFAULT_CENTER,
        zoom: start ? STREET_ZOOM : 5,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
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
          map.panTo(place.geometry.location)
          map.setZoom(STREET_ZOOM)
          afterSet(field)
        })
      }

      // Only the user dragging the map moves a pin, and only while a field is being pinned.
      map.addListener("dragstart", () => modeRef.current === "pin" && setDragging(true))
      map.addListener("dragend", () => {
        setDragging(false)
        if (modeRef.current !== "pin") return
        const c = map.getCenter()
        pinAt(activeRef.current, c.lat(), c.lng())
      })

      setReady(true)
      // Like a ride app: start at the user's location and use it as the pickup.
      if (!valueRef.current.source) useCurrentLocation("source", { silent: true })
    })().catch((err) => setError(err.message || "Could not load Google Maps"))

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Markers and the route line. In pin mode the field being set is shown by the fixed centre pin instead of a marker.
  useEffect(() => {
    const google = googleRef.current
    const map = mapRef.current
    if (!ready || !google || !map) return
    for (const field of ["source", "destination"]) {
      const point = value[field]
      const hidden = !point || (mode === "pin" && field === active)
      if (hidden) {
        markersRef.current[field]?.setMap(null)
        delete markersRef.current[field]
        continue
      }
      const position = { lat: point.lat, lng: point.lng }
      if (!markersRef.current[field]) {
        markersRef.current[field] = new google.maps.Marker({
          map,
          position,
          title: FIELD[field].label,
          icon: {
            path: "M12 0C7 0 3 4 3 9c0 6.5 9 15 9 15s9-8.5 9-15c0-5-4-9-9-9zm0 12.5A3.5 3.5 0 1 1 12 5.5a3.5 3.5 0 0 1 0 7z",
            fillColor: FIELD[field].fill,
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 1.5,
            scale: 1.6,
            anchor: new google.maps.Point(12, 24),
          },
        })
      } else {
        markersRef.current[field].setPosition(position)
      }
    }
    lineRef.current?.setMap(null)
    lineRef.current = null
    if (mode === "route" && value.source && value.destination) {
      lineRef.current = new google.maps.Polyline({
        map,
        path: [
          { lat: value.source.lat, lng: value.source.lng },
          { lat: value.destination.lat, lng: value.destination.lng },
        ],
        strokeColor: "#0B1C33",
        strokeOpacity: 0,
        icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 0.8, strokeWeight: 3, scale: 3 }, offset: "0", repeat: "14px" }],
      })
      const bounds = new google.maps.LatLngBounds()
      bounds.extend({ lat: value.source.lat, lng: value.source.lng })
      bounds.extend({ lat: value.destination.lat, lng: value.destination.lng })
      map.fitBounds(bounds, 70)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.source?.lat, value.source?.lng, value.destination?.lat, value.destination?.lng, ready, mode, active])

  // The × button empties one field and lets the user set it again.
  const clearField = (field) => {
    setTexts((t) => ({ ...t, [field]: "" }))
    setPoint(field, null)
    setActive(field)
    setMode("pin")
  }

  const swap = () => {
    const { source, destination } = valueRef.current
    setTexts((t) => ({ source: t.destination, destination: t.source }))
    valueRef.current = { source: destination, destination: source }
    onChange({ source: destination, destination: source })
  }

  if (keyMissing) {
    return <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Google Maps is not set up. Add VITE_GOOGLE_MAPS_API_KEY to the frontend environment file.</p>
  }

  const { source, destination } = value
  const km = source && destination ? distanceKm(source, destination) : null
  const activeMeta = FIELD[active]
  const inputClass = (field) =>
    `h-12 w-full rounded-xl border bg-[#FAF7F1] pl-10 pr-10 text-sm font-medium text-[#0F2238] outline-none placeholder:text-neutral-400 ${
      mode === "pin" && active === field ? "border-[#C28D2E] bg-white ring-2 ring-[#C28D2E]/20" : "border-transparent"
    }`

  const ClearButton = ({ field }) =>
    texts[field] ? (
      <button
        type="button"
        onClick={() => clearField(field)}
        aria-label={`Clear ${FIELD[field].label.toLowerCase()}`}
        className="absolute right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    ) : null

  return (
    <div className="space-y-4">
      {/* Route */}
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
              onFocus={() => focusField("source")}
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
              onFocus={() => focusField("destination")}
              onChange={(e) => setTexts((t) => ({ ...t, destination: e.target.value }))}
              placeholder="Drop-off location"
              className={inputClass("destination")}
            />
            <ClearButton field="destination" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => useCurrentLocation("source")}
          disabled={!ready || locating}
          className="mt-3 flex w-full items-center gap-3 rounded-xl border border-dashed border-[#C28D2E]/50 bg-[#FBF6EC] px-3 py-2.5 text-left disabled:opacity-60"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C28D2E]/15">
            {locating ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
            ) : (
              <Navigation className="h-4 w-4 fill-[#C28D2E] text-[#C28D2E]" />
            )}
          </span>
          <span>
            <span className="block text-sm font-bold text-[#0F2238]">{locating ? "Finding your location..." : "Use current location"}</span>
            <span className="block text-[11px] text-neutral-500">Set pickup to where you are now</span>
          </span>
        </button>
      </section>

      {/* Map */}
      <section className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3">
          <p className="text-sm font-bold text-[#0F2238]">{mode === "route" ? "Your route" : `Set ${activeMeta.label.toLowerCase()} on map`}</p>
          <div className="ml-auto flex rounded-full bg-[#F1EEE6] p-0.5">
            {["source", "destination"].map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => focusField(field)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  mode === "pin" && active === field ? "bg-[#0B1C33] text-white shadow" : "text-neutral-600"
                }`}
              >
                {FIELD[field].label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative h-[380px] bg-neutral-100">
          <div ref={mapDivRef} className="h-full w-full" />
          {!ready && !error && <div className="absolute inset-0 z-10 flex items-center justify-center text-xs text-neutral-500">Loading map...</div>}

          {/* Fixed centre pin: its tip marks the spot for the field being set. */}
          {ready && mode === "pin" && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-full flex-col items-center">
              <span className="mb-1 max-w-[220px] truncate rounded-lg bg-[#0B1C33] px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
                {resolving ? "Finding address..." : dragging ? `Move to ${activeMeta.label.toLowerCase()} spot` : `${activeMeta.label} here`}
              </span>
              <MapPin
                className={`h-11 w-11 drop-shadow-lg transition-transform ${dragging ? "-translate-y-2" : ""}`}
                style={{ fill: activeMeta.fill, color: activeMeta.dark }}
                strokeWidth={1.5}
              />
              {/* Shadow under the tip */}
              <span className={`-mt-1 h-1.5 rounded-full bg-black/30 transition-all ${dragging ? "w-4" : "w-2.5"}`} />
            </div>
          )}

          <button
            type="button"
            onClick={() => useCurrentLocation(mode === "pin" ? active : "source")}
            disabled={!ready || locating}
            aria-label="Go to my current location"
            className="absolute bottom-4 right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg disabled:opacity-50"
          >
            {locating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /> : <LocateFixed className="h-5 w-5 text-[#0B1C33]" />}
          </button>

          {mode === "route" && (
            <button
              type="button"
              onClick={() => focusField("source")}
              className="absolute bottom-4 left-3 z-20 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#0F2238] shadow-lg"
            >
              Adjust pins
            </button>
          )}
        </div>

        <p className="px-4 py-3 text-[11px] text-neutral-500">
          {mode === "route"
            ? "Tap Pickup or Drop-off above to move a pin."
            : `Drag the map to place the ${activeMeta.label.toLowerCase()} pin exactly, or search above.`}
        </p>
        {error && <p className="px-4 pb-3 text-xs text-destructive">{error}</p>}
      </section>

      {/* Summary and continue */}
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
            <p className="text-[10px] text-neutral-500">For every vehicle type</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onContinue}
          disabled={!source || !destination}
          className="h-12 w-full rounded-2xl bg-[#C28D2E] text-sm font-bold text-white shadow-md disabled:opacity-50"
        >
          See vehicles & prices
        </button>
      </section>
    </div>
  )
}
