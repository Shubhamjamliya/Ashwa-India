import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, MapPin, Save, Search, Shapes, X } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getGoogleMapsApiKey } from "@/shared/lib/googleMapsApiKey"
import { loadGoogleMaps as loadGoogle } from "@/shared/lib/googleMaps"

const MIN_POINTS = 3
const MAX_POINTS = 10

const orderPointsRadially = (pts) => {
  const points = pts
    .map((p) => ({ lat: typeof p.lat === "function" ? p.lat() : p.lat, lng: typeof p.lng === "function" ? p.lng() : p.lng }))
    .filter((p) => typeof p.lat === "number" && typeof p.lng === "number")

  if (points.length < 3) return points

  const cx = points.reduce((s, p) => s + p.lng, 0) / points.length
  const cy = points.reduce((s, p) => s + p.lat, 0) / points.length

  return [...points].sort((a, b) => Math.atan2(a.lat - cy, a.lng - cx) - Math.atan2(b.lat - cy, b.lng - cx))
}

export default function AddZone() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = Boolean(id)

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  const mapClickListenerRef = useRef(null)
  const drawPointsRef = useRef([])
  const isDrawingRef = useRef(false)

  const polygonRef = useRef(null)
  const pathMarkersRef = useRef([])
  const existingZonesPolygonsRef = useRef([])

  const [googleMapsApiKey, setGoogleMapsApiKey] = useState("")
  const [mapLoading, setMapLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({ country: "India", zoneName: "", unit: "kilometer" })
  const [coordinates, setCoordinates] = useState([])
  const [locationSearch, setLocationSearch] = useState("")
  const [existingZones, setExistingZones] = useState([])
  const autocompleteInputRef = useRef(null)
  const autocompleteRef = useRef(null)

  useEffect(() => {
    fetchExistingZones()
    loadGoogleMaps()
    if (isEditMode && id) fetchZone()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!mapLoading && mapInstanceRef.current && autocompleteInputRef.current && window.google?.maps?.places && !autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
        componentRestrictions: { country: "in" },
      })
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()
        if (place.geometry && place.geometry.location && mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(place.geometry.location)
          mapInstanceRef.current.setZoom(15)
          setLocationSearch(place.formatted_address || place.name || "")
        }
      })
      autocompleteRef.current = autocomplete
    }
  }, [mapLoading])

  const fetchExistingZones = async () => {
    try {
      const data = await apiFetch("/zones")
      setExistingZones((data.zones || []).filter((z) => z._id !== id))
    } catch (err) {
      setExistingZones([])
    }
  }

  const fetchZone = async () => {
    try {
      setLoading(true)
      const data = await apiFetch(`/zones/${id}`)
      const zone = data.zone
      setFormData({ country: zone.country || "India", zoneName: zone.name || "", unit: zone.unit || "kilometer" })
      const coords = zone.polygon.coordinates[0].slice(0, -1).map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
      if (coords.length > 0) setCoordinates(coords)
    } catch (err) {
      alert("Failed to load zone")
      navigate("/admin/system/zones")
    } finally {
      setLoading(false)
    }
  }

  const loadGoogleMaps = async () => {
    try {
      const apiKey = await getGoogleMapsApiKey()
      setGoogleMapsApiKey(apiKey || "")

      if (window.google && window.google.maps) {
        initializeMap(window.google)
        return
      }

      if (apiKey) {
        const google = await loadGoogle()
        initializeMap(google)
      } else {
        setMapLoading(false)
      }
    } catch (err) {
      setMapLoading(false)
    }
  }

  const renderVertexMarkers = (google, map, latLngs) => {
    pathMarkersRef.current?.forEach((m) => m.setMap(null))
    pathMarkersRef.current = latLngs.map(
      (latLng, i) =>
        new google.maps.Marker({
          position: latLng,
          map,
          clickable: false,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#9333ea", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
          zIndex: 1000,
          title: `Point ${i + 1}`,
        })
    )
  }

  const renderDrawingPolygon = (google, map) => {
    const points = drawPointsRef.current
    if (polygonRef.current) {
      polygonRef.current.setMap(null)
      polygonRef.current = null
    }

    const ordered = points.length >= 3 ? orderPointsRadially(points) : points.map((p) => ({ lat: p.lat(), lng: p.lng() }))

    if (ordered.length >= 2) {
      polygonRef.current = new google.maps.Polygon({
        paths: ordered,
        fillColor: "#9333ea",
        fillOpacity: 0.35,
        strokeColor: "#9333ea",
        strokeWeight: 2,
        clickable: false,
        editable: false,
        zIndex: 1,
      })
      polygonRef.current.setMap(map)
    }

    renderVertexMarkers(google, map, points)
    setCoordinates(ordered.map((p) => ({ latitude: parseFloat(p.lat.toFixed(6)), longitude: parseFloat(p.lng.toFixed(6)) })))
  }

  const drawEditablePolygon = (google, map, coords) => {
    const path = coords.map((c) => new google.maps.LatLng(c.latitude, c.longitude))
    if (polygonRef.current) {
      polygonRef.current.setMap(null)
      polygonRef.current = null
    }
    pathMarkersRef.current?.forEach((m) => m.setMap(null))
    pathMarkersRef.current = []

    const polygon = new google.maps.Polygon({
      paths: path,
      strokeColor: "#9333ea",
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: "#9333ea",
      fillOpacity: 0.35,
      editable: true,
      draggable: false,
      clickable: false,
    })
    polygon.setMap(map)
    polygonRef.current = polygon

    const sync = () => {
      const p = polygon.getPath()
      const out = []
      p.forEach((ll) => out.push({ latitude: parseFloat(ll.lat().toFixed(6)), longitude: parseFloat(ll.lng().toFixed(6)) }))
      setCoordinates(out)
    }
    const pp = polygon.getPath()
    google.maps.event.addListener(pp, "set_at", sync)
    google.maps.event.addListener(pp, "insert_at", sync)
    google.maps.event.addListener(pp, "remove_at", sync)

    const bounds = new google.maps.LatLngBounds()
    path.forEach((latLng) => bounds.extend(latLng))
    map.fitBounds(bounds)
  }

  const finishDrawing = () => {
    const google = window.google
    const map = mapInstanceRef.current
    if (!google || !map) return false

    const points = drawPointsRef.current
    if (points.length < MIN_POINTS) {
      alert(`Please click at least ${MIN_POINTS} points on the map.`)
      return false
    }

    const ordered = orderPointsRadially(points)
    const coords = ordered.map((p) => ({ latitude: parseFloat(p.lat.toFixed(6)), longitude: parseFloat(p.lng.toFixed(6)) }))
    setCoordinates(coords)
    drawEditablePolygon(google, map, coords)
    return true
  }

  const toggleDrawingMode = () => {
    const google = window.google
    const map = mapInstanceRef.current
    if (!google || !map) {
      alert("Map is still loading.")
      return
    }

    if (isDrawing) {
      if (finishDrawing() === false) return
      isDrawingRef.current = false
      setIsDrawing(false)
      map.setOptions({ draggableCursor: null })
      existingZonesPolygonsRef.current.forEach((p) => p?.setOptions?.({ clickable: true }))
    } else {
      clearDrawing()
      drawPointsRef.current = []
      isDrawingRef.current = true
      setIsDrawing(true)
      map.setOptions({ draggableCursor: "crosshair" })
      existingZonesPolygonsRef.current.forEach((p) => p?.setOptions?.({ clickable: false }))
    }
  }

  const clearDrawing = () => {
    drawPointsRef.current = []
    if (polygonRef.current) {
      polygonRef.current.setMap(null)
      polygonRef.current = null
    }
    pathMarkersRef.current?.forEach((m) => m.setMap(null))
    pathMarkersRef.current = []
    setCoordinates([])
  }

  const initializeMap = (google) => {
    if (!mapRef.current) return

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 20.5937, lng: 78.9629 },
      zoom: 5,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE],
      },
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      scrollwheel: true,
      gestureHandling: "greedy",
      disableDoubleClickZoom: false,
      clickableIcons: false,
    })

    mapInstanceRef.current = map

    mapClickListenerRef.current = google.maps.event.addListener(map, "click", (event) => {
      if (!isDrawingRef.current) return
      if (drawPointsRef.current.length >= MAX_POINTS) {
        alert(`You can add at most ${MAX_POINTS} points. Click "Finish Drawing" to complete.`)
        return
      }
      drawPointsRef.current.push(event.latLng)
      renderDrawingPolygon(google, map)
    })

    setMapLoading(false)
  }

  const drawExistingZonesOnMap = (google, map) => {
    if (!existingZones || existingZones.length === 0) return

    existingZonesPolygonsRef.current.forEach((polygon) => polygon?.setMap(null))
    existingZonesPolygonsRef.current = []

    existingZones.forEach((zone) => {
      const ring = zone.polygon?.coordinates?.[0]
      if (!ring || ring.length < 4) return

      const path = ring.slice(0, -1).map(([lng, lat]) => new google.maps.LatLng(lat, lng))
      if (path.length < 3) return

      const polygon = new google.maps.Polygon({
        paths: path,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        editable: false,
        draggable: false,
        clickable: !isDrawingRef.current,
        zIndex: 0,
      })

      polygon.setMap(map)
      existingZonesPolygonsRef.current.push(polygon)

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px;"><strong>${zone.name || "Unnamed Zone"}</strong></div>`,
      })
      polygon.addListener("click", () => {
        infoWindow.setPosition(polygon.getPath().getAt(0))
        infoWindow.open(map)
      })
    })
  }

  useEffect(() => {
    if (!mapLoading && mapInstanceRef.current && existingZones.length > 0 && window.google) {
      drawExistingZonesOnMap(window.google, mapInstanceRef.current)
    }
  }, [existingZones, mapLoading])

  // Draw the zone being edited once both the map and its coordinates are ready.
  useEffect(() => {
    if (isEditMode && coordinates.length >= MIN_POINTS && mapInstanceRef.current && window.google && !mapLoading && !polygonRef.current) {
      drawEditablePolygon(window.google, mapInstanceRef.current, coordinates)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, coordinates.length, mapLoading])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.zoneName.trim() || coordinates.length < MIN_POINTS) return

    setError("")
    setLoading(true)
    try {
      const ring = coordinates.map((c) => [c.longitude, c.latitude])
      ring.push(ring[0])

      const payload = {
        name: formData.zoneName.trim(),
        country: formData.country,
        unit: formData.unit,
        isActive: true,
        polygon: { type: "Polygon", coordinates: [ring] },
      }

      if (isEditMode) {
        await apiFetch(`/zones/${id}`, { method: "PATCH", body: payload })
      } else {
        await apiFetch("/zones", { method: "POST", body: payload })
      }
      navigate("/admin/system/zones")
    } catch (err) {
      setError(err.message || "Failed to save zone")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl p-4 lg:p-6">
        <div className="mb-6 flex items-center gap-4">
          <button onClick={() => navigate("/admin/system/zones")} className="rounded-lg p-2 transition-colors hover:bg-neutral-200">
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{isEditMode ? "Edit Zone" : "Add New Zone"}</h1>
              <p className="text-sm text-neutral-600">
                {isEditMode ? "Update this service area" : "Draw the area where Ashwa India is available"}
              </p>
            </div>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-neutral-900">Zone Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-neutral-700">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    >
                      <option value="India">India</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-neutral-700">
                      Zone Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.zoneName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, zoneName: e.target.value }))}
                      placeholder="Enter zone name"
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-neutral-700">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    >
                      <option value="kilometer">Kilometers (km)</option>
                      <option value="miles">Miles (mi)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Draw Zone on Map</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleDrawingMode}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                      isDrawing ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-primary text-white hover:bg-primary/90"
                    }`}
                  >
                    <Shapes className="h-4 w-4" />
                    <span>{isDrawing ? "Finish Drawing" : "Start Drawing"}</span>
                  </button>
                  {coordinates.length > 0 && (
                    <button
                      type="button"
                      onClick={clearDrawing}
                      className="flex items-center gap-2 rounded-lg bg-neutral-600 px-4 py-2 text-white transition-colors hover:bg-neutral-700"
                    >
                      <X className="h-4 w-4" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {isDrawing && (
                <p className="mb-4 rounded border border-primary/20 bg-primary/5 p-3 text-sm text-neutral-700">
                  Click on the map to add points ({MIN_POINTS}–{MAX_POINTS}), then click <b>Finish Drawing</b>.
                </p>
              )}

              <div className="mb-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <input
                    ref={autocompleteInputRef}
                    type="text"
                    placeholder="Search location on map..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                {coordinates.length > 0 && (
                  <p className="mt-2 text-xs text-neutral-600">
                    Points drawn: <strong>{coordinates.length}</strong>
                    {coordinates.length < MIN_POINTS && (
                      <span className="ml-2 text-red-600">(Minimum {MIN_POINTS} points required)</span>
                    )}
                  </p>
                )}
              </div>

              <div className="relative" style={{ height: 600 }}>
                <div ref={mapRef} className="h-full w-full rounded-lg" />
                {mapLoading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-neutral-100">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                      <p className="text-neutral-600">Loading map...</p>
                    </div>
                  </div>
                )}
                {!googleMapsApiKey && !mapLoading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-neutral-100">
                    <div className="p-6 text-center">
                      <MapPin className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
                      <p className="text-sm text-neutral-600">Google Maps API key not found</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/system/zones")}
              className="rounded-lg border border-neutral-300 px-6 py-2 text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || coordinates.length < MIN_POINTS || !formData.zoneName.trim() || isDrawing}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Zone</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
