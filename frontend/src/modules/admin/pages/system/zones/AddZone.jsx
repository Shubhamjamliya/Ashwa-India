import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-draw/dist/leaflet.draw.css"
import "leaflet-draw"
import { ArrowLeft, MapPin, Save, Search, Shapes, X } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { searchPlaces } from "@/shared/lib/geocoding"

const MIN_POINTS = 3
const MAX_POINTS = 10
const INDIA_CENTER = [20.5937, 78.9629]
const DRAW_COLOR = "#9333ea"

// Sorts points around their centroid so clicking in any order still produces
// a non-self-intersecting polygon — same approach as the reference project.
function orderPointsRadially(points) {
  if (points.length < 3) return points
  const cx = points.reduce((s, p) => s + p.lng, 0) / points.length
  const cy = points.reduce((s, p) => s + p.lat, 0) / points.length
  return [...points].sort((a, b) => Math.atan2(a.lat - cy, a.lng - cx) - Math.atan2(b.lat - cy, b.lng - cx))
}

// Owns all the imperative Leaflet drawing state (click-to-add-point polygon,
// draggable-vertex editing once finished) and exposes it to the parent page
// via a ref, since the Start/Finish/Clear buttons live outside <MapContainer>.
const DrawingMap = forwardRef(function DrawingMap({ existingZones, initialCoordinates, onCoordinatesChange }, ref) {
  const map = useMap()
  const isDrawingRef = useRef(false)
  const drawPointsRef = useRef([])
  const polygonRef = useRef(null)
  const vertexMarkersRef = useRef([])
  const existingLayersRef = useRef([])
  const onCoordinatesChangeRef = useRef(onCoordinatesChange)
  onCoordinatesChangeRef.current = onCoordinatesChange

  const clearShape = useCallback(() => {
    drawPointsRef.current = []
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current)
      polygonRef.current = null
    }
    vertexMarkersRef.current.forEach((m) => map.removeLayer(m))
    vertexMarkersRef.current = []
    onCoordinatesChangeRef.current([])
  }, [map])

  const renderVertexMarkers = useCallback(
    (points) => {
      vertexMarkersRef.current.forEach((m) => map.removeLayer(m))
      vertexMarkersRef.current = points.map((p) =>
        L.circleMarker(p, { radius: 6, color: "#ffffff", weight: 2, fillColor: DRAW_COLOR, fillOpacity: 1 }).addTo(map)
      )
    },
    [map]
  )

  const renderDrawingPolygon = useCallback(() => {
    const points = drawPointsRef.current
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current)
      polygonRef.current = null
    }

    const ordered = points.length >= 3 ? orderPointsRadially(points) : points
    if (ordered.length >= 2) {
      polygonRef.current = L.polygon(ordered, {
        color: DRAW_COLOR,
        weight: 2,
        fillColor: DRAW_COLOR,
        fillOpacity: 0.3,
        interactive: false,
      }).addTo(map)
    }

    renderVertexMarkers(points)
    onCoordinatesChangeRef.current(ordered.map((p) => ({ latitude: p.lat, longitude: p.lng })))
  }, [map, renderVertexMarkers])

  const drawEditablePolygon = useCallback(
    (coords) => {
      const latlngs = coords.map((c) => L.latLng(c.latitude, c.longitude))
      if (polygonRef.current) {
        map.removeLayer(polygonRef.current)
        polygonRef.current = null
      }
      vertexMarkersRef.current.forEach((m) => map.removeLayer(m))
      vertexMarkersRef.current = []

      const polygon = L.polygon(latlngs, {
        color: DRAW_COLOR,
        weight: 3,
        fillColor: DRAW_COLOR,
        fillOpacity: 0.3,
      }).addTo(map)
      polygon.editing.enable()
      polygonRef.current = polygon

      const sync = () => {
        const out = polygon
          .getLatLngs()[0]
          .map((ll) => ({ latitude: parseFloat(ll.lat.toFixed(6)), longitude: parseFloat(ll.lng.toFixed(6)) }))
        onCoordinatesChangeRef.current(out)
      }
      polygon.on('edit', sync)

      map.fitBounds(polygon.getBounds(), { maxZoom: 15 })
    },
    [map]
  )

  useImperativeHandle(
    ref,
    () => ({
      startDrawing() {
        clearShape()
        isDrawingRef.current = true
        map.getContainer().style.cursor = 'crosshair'
      },
      finishDrawing() {
        const points = drawPointsRef.current
        if (points.length < MIN_POINTS) return false
        const ordered = orderPointsRadially(points)
        const coords = ordered.map((p) => ({ latitude: p.lat, longitude: p.lng }))
        isDrawingRef.current = false
        map.getContainer().style.cursor = ''
        drawEditablePolygon(coords)
        return true
      },
      clear() {
        clearShape()
      },
      flyTo(lat, lng) {
        map.flyTo([lat, lng], 13)
      },
    }),
    [map, clearShape, drawEditablePolygon]
  )

  // Map click handler — only adds points while in drawing mode.
  useEffect(() => {
    const handleClick = (e) => {
      if (!isDrawingRef.current) return
      if (drawPointsRef.current.length >= MAX_POINTS) return
      drawPointsRef.current = [...drawPointsRef.current, e.latlng]
      renderDrawingPolygon()
    }
    map.on('click', handleClick)
    return () => map.off('click', handleClick)
  }, [map, renderDrawingPolygon])

  // Pre-fill an editable polygon when editing an existing zone.
  useEffect(() => {
    if (initialCoordinates && initialCoordinates.length >= MIN_POINTS) {
      drawEditablePolygon(initialCoordinates)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Render other zones as light, non-interactive reference polygons.
  useEffect(() => {
    existingLayersRef.current.forEach((l) => map.removeLayer(l))
    existingLayersRef.current = existingZones.map((zone) => {
      const latlngs = zone.polygon.coordinates[0].slice(0, -1).map(([lng, lat]) => [lat, lng])
      const layer = L.polygon(latlngs, {
        color: '#3b82f6',
        weight: 2,
        opacity: 0.6,
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        interactive: true,
      }).addTo(map)
      layer.bindTooltip(zone.name, { sticky: true })
      return layer
    })
    return () => existingLayersRef.current.forEach((l) => map.removeLayer(l))
  }, [map, existingZones])

  return null
})

export default function AddZone() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = Boolean(id)
  const drawingMapRef = useRef(null)

  const [formData, setFormData] = useState({ country: "India", zoneName: "", unit: "kilometer" })
  const [coordinates, setCoordinates] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [existingZones, setExistingZones] = useState([])
  const [initialCoordinates, setInitialCoordinates] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingZone, setLoadingZone] = useState(isEditMode)
  const [error, setError] = useState("")

  const [locationSearch, setLocationSearch] = useState("")
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    fetchExistingZones()
    if (isEditMode) fetchZone()
  }, [id])

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
      setLoadingZone(true)
      const data = await apiFetch(`/zones/${id}`)
      const zone = data.zone
      setFormData({ country: zone.country || "India", zoneName: zone.name || "", unit: zone.unit || "kilometer" })
      const coords = zone.polygon.coordinates[0].slice(0, -1).map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
      setInitialCoordinates(coords)
      setCoordinates(coords)
    } catch (err) {
      alert("Failed to load zone")
      navigate("/admin/system/zones")
    } finally {
      setLoadingZone(false)
    }
  }

  useEffect(() => {
    const q = locationSearch.trim()
    if (q.length < 3) {
      setSuggestions([])
      return
    }
    const t = setTimeout(() => {
      searchPlaces(q).then(setSuggestions).catch(() => setSuggestions([]))
    }, 350)
    return () => clearTimeout(t)
  }, [locationSearch])

  const pickSuggestion = (s) => {
    drawingMapRef.current?.flyTo(s.lat, s.lng)
    setLocationSearch(s.title)
    setSuggestions([])
  }

  const toggleDrawingMode = () => {
    if (isDrawing) {
      const ok = drawingMapRef.current?.finishDrawing()
      if (ok === false) {
        alert(`Please click at least ${MIN_POINTS} points on the map.`)
        return
      }
      setIsDrawing(false)
    } else {
      drawingMapRef.current?.startDrawing()
      setIsDrawing(true)
    }
  }

  const clearDrawing = () => {
    drawingMapRef.current?.clear()
    setCoordinates([])
    setIsDrawing(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.zoneName.trim() || coordinates.length < MIN_POINTS) return

    setError("")
    setLoading(true)
    try {
      const ring = [...coordinates.map((c) => [c.longitude, c.latitude])]
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

              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Search location on map..."
                  className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/40"
                />
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-[1000] mt-1 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => pickSuggestion(s)}
                        className="flex w-full items-start gap-2 border-b border-neutral-100 px-4 py-3 text-left last:border-b-0 hover:bg-neutral-50"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-neutral-900">{s.title}</span>
                          <span className="block truncate text-xs text-neutral-500">{s.subtitle}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
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
                {loadingZone ? (
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-neutral-100">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                      <p className="text-neutral-600">Loading zone...</p>
                    </div>
                  </div>
                ) : (
                  <MapContainer center={INDIA_CENTER} zoom={5} style={{ height: "100%", width: "100%" }} className="rounded-lg">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <DrawingMap
                      ref={drawingMapRef}
                      existingZones={existingZones}
                      initialCoordinates={initialCoordinates}
                      onCoordinatesChange={setCoordinates}
                    />
                  </MapContainer>
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
