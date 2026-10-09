import { useEffect, useRef, useState } from "react"
import { LocateFixed, Maximize2 } from "lucide-react"
import { loadGoogleMaps } from "@/shared/lib/googleMaps"
import { distanceKm } from "@/shared/lib/geo"

// Re-ask Google for directions only after the vehicle has moved this far, to keep API calls low.
const REROUTE_KM = 0.3
const COLORS = { route: "#0B1C33", trip: "#C28D2E", trail: "#94A3B8", pickup: "#10B981", drop: "#F43F5E" }
const PIN_PATH = "M12 0C7 0 3 4 3 9c0 6.5 9 15 9 15s9-8.5 9-15c0-5-4-9-9-9zm0 12.5A3.5 3.5 0 1 1 12 5.5a3.5 3.5 0 0 1 0 7z"

const toLatLng = (p) => ({ lat: Number(p.lat), lng: Number(p.lng) })
const sameSpot = (a, b) => a && b && a.lat === b.lat && a.lng === b.lng

// Which point the vehicle is heading for at this stage of the trip.
export function targetFor(stage) {
  if (stage === "in_transit") return "drop"
  if (stage === "scheduled" || stage === "to_pickup") return "pickup"
  return null
}

function pinIcon(google, color) {
  return { path: PIN_PATH, fillColor: color, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 1.5, scale: 1.7, anchor: new google.maps.Point(12, 24) }
}

function vehicleIcon(google, heading) {
  return {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    scale: 6,
    rotation: Number.isFinite(heading) ? heading : 0,
    fillColor: COLORS.route,
    fillOpacity: 1,
    strokeColor: "#fff",
    strokeWeight: 2,
  }
}

// A road route between two points from Google Directions; a straight line when Directions is unavailable.
function routeBetween(google, service, from, to) {
  return new Promise((resolve) => {
    service.route({ origin: from, destination: to, travelMode: google.maps.TravelMode.DRIVING }, (result, status) => {
      if (status === "OK" && result?.routes?.[0]) {
        const leg = result.routes[0].legs[0]
        resolve({
          path: result.routes[0].overview_path,
          distanceKm: leg.distance.value / 1000,
          durationMin: Math.round(leg.duration.value / 60),
          road: true,
        })
      } else {
        resolve({ path: [from, to], distanceKm: distanceKm(from, to), durationMin: null, road: false })
      }
    })
  })
}

// Live trip map on Google Maps.
// pickup / drop: { lat, lng }. vehicle: { lat, lng, heading? } or null. trail: points already driven.
// stage decides where the vehicle is heading. onRoute({ to, distanceKm, durationMin, road }) reports the live leg.
// Shared runs pass `stops` ([{ point, kind: "pickup" | "drop", done }]) to mark every stop, and `target` (the next stop)
// to route the vehicle there instead of working it out from `stage`.
export default function TripMap({ pickup, drop, vehicle, trail = [], stage, onRoute, className = "h-[50vh]", follow = false, stops = [], target: targetOverride = null }) {
  const divRef = useRef(null)
  const ref = useRef({})
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState("")
  const [following, setFollowing] = useState(follow)
  const onRouteRef = useRef(onRoute)
  onRouteRef.current = onRoute

  // Load Google and create the map, markers and lines once.
  useEffect(() => {
    let cancelled = false
    loadGoogleMaps()
      .then((google) => {
        if (cancelled) return
        if (!google) return setFailed("Google Maps is not set up. Add VITE_GOOGLE_MAPS_API_KEY to the frontend environment file.")
        const map = new google.maps.Map(divRef.current, {
          center: toLatLng(pickup),
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        })
        // Panning by hand stops auto-follow until the user taps "recenter".
        map.addListener("dragstart", () => setFollowing(false))
        const line = (opts) => new google.maps.Polyline({ map, clickable: false, ...opts })
        ref.current = {
          google,
          map,
          directions: new google.maps.DirectionsService(),
          tripLine: line({ strokeColor: COLORS.trip, strokeOpacity: 0.85, strokeWeight: 5, zIndex: 1 }),
          trailLine: line({ strokeColor: COLORS.trail, strokeOpacity: 0.9, strokeWeight: 5, zIndex: 2 }),
          routeCasing: line({ strokeColor: "#ffffff", strokeOpacity: 1, strokeWeight: 9, zIndex: 3 }),
          routeLine: line({ strokeColor: COLORS.route, strokeOpacity: 1, strokeWeight: 5, zIndex: 4 }),
          pickupMarker: new google.maps.Marker({ map, icon: pinIcon(google, COLORS.pickup), title: "Pickup", zIndex: 5 }),
          dropMarker: new google.maps.Marker({ map, icon: pinIcon(google, COLORS.drop), title: "Drop-off", zIndex: 5 }),
          vehicleMarker: new google.maps.Marker({ map: null, icon: vehicleIcon(google, 0), title: "Vehicle", zIndex: 10 }),
          fitted: false,
          tripKey: null,
          routeFrom: null,
          routeTo: null,
          shown: null,
        }
        setReady(true)
      })
      .catch((err) => setFailed(err.message || "Could not load Google Maps"))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fitAll = () => {
    const { google, map } = ref.current
    if (!google) return
    const bounds = new google.maps.LatLngBounds()
    for (const p of [pickup, drop, vehicle, ...stops.map((st) => st.point)]) if (p?.lat != null) bounds.extend(toLatLng(p))
    map.fitBounds(bounds, 60)
  }

  // Pickup and drop pins, and the planned route between them (fetched once per pair of points).
  useEffect(() => {
    const r = ref.current
    if (!ready || !pickup || !drop) return
    r.pickupMarker.setPosition(toLatLng(pickup))
    r.dropMarker.setPosition(toLatLng(drop))
    const key = `${pickup.lat},${pickup.lng}|${drop.lat},${drop.lng}`
    if (r.tripKey !== key) {
      r.tripKey = key
      routeBetween(r.google, r.directions, toLatLng(pickup), toLatLng(drop)).then((route) => {
        if (r.tripKey === key) r.tripLine.setPath(route.path)
      })
    }
    if (!r.fitted) {
      r.fitted = true
      fitAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pickup?.lat, pickup?.lng, drop?.lat, drop?.lng])

  // Every stop of a shared run (the first pickup and last drop already have their own pins).
  useEffect(() => {
    const r = ref.current
    if (!ready) return
    for (const m of r.stopMarkers || []) m.setMap(null)
    r.stopMarkers = stops
      .filter((st) => st.point?.lat != null && !sameSpot(toLatLng(st.point), toLatLng(pickup)) && !sameSpot(toLatLng(st.point), toLatLng(drop)))
      .map(
        (st) =>
          new r.google.maps.Marker({
            map: r.map,
            position: toLatLng(st.point),
            title: st.label || (st.kind === "pickup" ? "Pickup" : "Drop-off"),
            zIndex: 5,
            opacity: st.done ? 0.45 : 1,
            icon: {
              path: r.google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: st.kind === "pickup" ? COLORS.pickup : COLORS.drop,
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          })
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, JSON.stringify(stops.map((st) => [st.point?.lat, st.point?.lng, st.kind, st.done]))])

  // Path already driven.
  useEffect(() => {
    if (!ready) return
    ref.current.trailLine.setPath(trail.filter((p) => p?.lat != null).map(toLatLng))
  }, [ready, trail])

  // Vehicle marker (glides to each new position), plus the live road route from it to its next stop.
  useEffect(() => {
    const r = ref.current
    if (!ready) return
    const to = targetOverride ? targetOverride.kind || "drop" : targetFor(stage)
    if (!vehicle || vehicle.lat == null) {
      r.vehicleMarker.setMap(null)
      r.routeLine.setPath([])
      r.routeCasing.setPath([])
      return
    }
    const next = toLatLng(vehicle)
    r.vehicleMarker.setIcon(vehicleIcon(r.google, vehicle.heading))
    if (!r.vehicleMarker.getMap()) r.vehicleMarker.setMap(r.map)

    // Glide from the last position over ~1s rather than jumping.
    const from = r.shown || next
    r.shown = next
    cancelAnimationFrame(r.anim)
    const start = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - start) / 1000)
      r.vehicleMarker.setPosition({ lat: from.lat + (next.lat - from.lat) * t, lng: from.lng + (next.lng - from.lng) * t })
      if (t < 1) r.anim = requestAnimationFrame(step)
    }
    r.anim = requestAnimationFrame(step)

    if (following) r.map.panTo(next)

    const target = targetOverride ? targetOverride.point : to === "pickup" ? pickup : to === "drop" ? drop : null
    if (!target) {
      r.routeLine.setPath([])
      r.routeCasing.setPath([])
      return
    }
    const targetLatLng = toLatLng(target)
    const needsRoute = !sameSpot(r.routeTo, targetLatLng) || !r.routeFrom || distanceKm(r.routeFrom, next) >= REROUTE_KM
    if (needsRoute) {
      r.routeFrom = next
      r.routeTo = targetLatLng
      routeBetween(r.google, r.directions, next, targetLatLng).then((route) => {
        if (!sameSpot(r.routeTo, targetLatLng)) return
        r.routeLine.setPath(route.path)
        r.routeCasing.setPath(route.path)
        onRouteRef.current?.({ to, ...route })
      })
    } else {
      // Between reroutes, keep the remaining distance honest with a straight-line estimate.
      onRouteRef.current?.({ to, distanceKm: distanceKm(next, targetLatLng), durationMin: null, road: false, estimate: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, vehicle?.lat, vehicle?.lng, vehicle?.heading, stage, following, targetOverride?.point?.lat, targetOverride?.point?.lng])

  useEffect(() => () => cancelAnimationFrame(ref.current.anim), [])

  if (failed) {
    return <div className={`flex items-center justify-center bg-neutral-100 p-6 text-center text-xs text-neutral-500 ${className}`}>{failed}</div>
  }

  return (
    <div className={`relative bg-neutral-100 ${className}`}>
      <div ref={divRef} className="h-full w-full" />
      {!ready && <div className="absolute inset-0 z-10 flex items-center justify-center text-xs text-neutral-500">Loading map...</div>}
      {ready && (
        <div className="absolute bottom-4 right-3 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={fitAll}
            aria-label="Show whole trip"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg"
          >
            <Maximize2 className="h-4 w-4 text-[#0B1C33]" />
          </button>
          {vehicle?.lat != null && (
            <button
              type="button"
              onClick={() => {
                setFollowing(true)
                ref.current.map.panTo(toLatLng(vehicle))
                ref.current.map.setZoom(16)
              }}
              aria-label="Follow vehicle"
              className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg ${following ? "bg-[#0B1C33]" : "bg-white"}`}
            >
              <LocateFixed className={`h-5 w-5 ${following ? "text-white" : "text-[#0B1C33]"}`} />
            </button>
          )}
        </div>
      )}
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap gap-1.5">
        {[
          [COLORS.route, "Route"],
          [COLORS.trail, "Driven"],
          [COLORS.trip, "Trip"],
        ].map(([color, label]) => (
          <span key={label} className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#0F2238] shadow">
            <span className="h-1.5 w-3 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
