import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { io } from "socket.io-client"
import { ArrowLeft, CheckCircle2, Navigation, Pause, Phone, Radio, Route } from "lucide-react"
import { apiFetch, getSession } from "@/shared/lib/api"
import { directionsUrl, distanceKm } from "@/shared/lib/geo"
import TripMap, { targetFor } from "@/shared/maps/TripMap"
import OtpStep from "../components/OtpStep"

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")
// How often the live position is sent to the customer while the trip is running.
const PUSH_MS = 8000
const TRAIL_STEP_KM = 0.02

const STATUS_TEXT = {
  scheduled: "Not started",
  to_pickup: "Heading to pickup",
  in_transit: "Heading to drop-off",
  delivered: "Delivered",
}

// Compass bearing (0 = north) from a to b, for pointing the vehicle arrow when the device gives no heading.
function bearing(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat))
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

const formatEta = (min) => (min == null ? null : min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`)

// Transporter's live tracking screen for one booking: in-app route, live position shared with the customer,
// and the trip actions (start, pickup OTP, delivery OTP) without leaving the map.
export default function TrackTrip() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [here, setHere] = useState(null)
  const [trail, setTrail] = useState([])
  const [route, setRoute] = useState(null)
  const [lastSentAt, setLastSentAt] = useState(null)
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState("")
  const latest = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/transport/requests/${id}`)
      setRequest(data.request)
      setTrail(data.request.trail || [])
      if (data.request.transporterLocation?.lat != null && !latest.current) setHere(data.request.transporterLocation)
    } catch (err) {
      setError(err.message || "Failed to load booking")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Status changes made elsewhere (admin cancel, pause from the job page) show up here too.
  useEffect(() => {
    const { accessToken } = getSession("transporter")
    const socket = io(SOCKET_URL, { auth: { token: accessToken }, transports: ["websocket", "polling"] })
    const onUpdate = (updated) => {
      if (updated.sharedGroup) load()
      else if (updated._id === id) setRequest((prev) => (prev ? { ...prev, ...updated, trail: prev.trail } : prev))
    }
    socket.on("transport:update", onUpdate)
    return () => {
      socket.off("transport:update", onUpdate)
      socket.disconnect()
    }
  }, [id, load])

  const stage = request?.stage
  // A shared run with several customers is one trip: it follows the run's next stop, whoever's booking that is.
  const run = request?.sharedRun?.customers > 1 ? request.sharedRun : null
  const live = run
    ? run.started && !run.finished && !request?.paused
    : request?.status === "accepted" && (stage === "to_pickup" || stage === "in_transit") && !request?.paused
  // The run's location goes through the next stop's booking, which is always still on the road.
  const pushId = run ? run.next?.requestId : id

  // Follow the device's GPS the whole time the screen is open, so the route preview starts from here.
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("This device does not share its location")
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const prev = latest.current
        const heading = Number.isFinite(pos.coords.heading)
          ? pos.coords.heading
          : prev && distanceKm(prev, point) > 0.005
            ? bearing(prev, point)
            : prev?.heading
        latest.current = { ...point, heading }
        setHere(latest.current)
      },
      () => setError("Allow location access so the customer can track you."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // While the trip runs, send the position to the customer and grow the driven path.
  useEffect(() => {
    if (!live) return
    const push = async () => {
      const point = latest.current
      if (!point) return
      try {
        if (!pushId) return
        await apiFetch(`/transport/requests/${pushId}/location`, { method: "POST", body: point })
        setLastSentAt(new Date())
        setTrail((prev) => {
          const last = prev[prev.length - 1]
          return !last || distanceKm(last, point) >= TRAIL_STEP_KM ? [...prev, { lat: point.lat, lng: point.lng }] : prev
        })
      } catch {
        // The next tick retries; a paused or finished trip is picked up from the socket.
      }
    }
    push()
    const timer = setInterval(push, PUSH_MS)
    return () => clearInterval(timer)
  }, [live, pushId])

  // Keep the screen awake while sharing location, where the browser allows it.
  useEffect(() => {
    if (!live || !("wakeLock" in navigator)) return
    let lock = null
    navigator.wakeLock
      .request("screen")
      .then((l) => (lock = l))
      .catch(() => {})
    return () => lock?.release().catch(() => {})
  }, [live])

  const runAction = async (body, requestId = id) => {
    setBusy(true)
    setError("")
    try {
      const data = await apiFetch(`/transport/requests/${requestId}/stage`, { method: "PATCH", body })
      if (run) await load()
      else setRequest((prev) => ({ ...prev, ...data.request, trail: prev?.trail }))
      setOtp("")
    } catch (err) {
      setError(err.message || "Action failed")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
      </div>
    )
  }
  if (!request) return <p className="px-8 py-24 text-center text-sm text-destructive">{error || "Booking not found"}</p>

  const nextStop = run?.stops.find((st) => st.isNext)
  const finished = run ? run.finished : request.status === "completed"
  const to = run ? (run.next ? (run.next.kind === "pickup" ? "pickup" : "drop") : null) : targetFor(stage)
  const target = run ? (run.started ? run.next?.point || null : null) : to === "pickup" ? request.source : to === "drop" ? request.destination : null
  const straightKm = here && target ? distanceKm(here, target) : null
  const legKm = route?.to === to ? route.distanceKm : straightKm
  const eta = route?.road && route.to === to ? formatEta(route.durationMin) : null
  // Who to call: the next stop's customer on a run.
  const user = run ? (nextStop ? { name: nextStop.name, phone: nextStop.phone } : {}) : request.user || {}
  const notStarted = run ? !run.started : request.status === "accepted" && stage === "scheduled"

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F4EF]">
      <div className="relative">
        <TripMap
          pickup={run ? run.stops[0]?.point : request.source}
          drop={run ? run.stops[run.stops.length - 1]?.point : request.destination}
          stops={run ? run.stops : []}
          target={run && target ? { point: target, kind: to } : null}
          vehicle={here}
          trail={trail}
          stage={finished ? "delivered" : stage}
          onRoute={(r) => setRoute((prev) => (r.estimate && prev?.road && prev.to === r.to ? prev : r))}
          follow
          className="h-[58vh]"
        />
        <div className="absolute left-3 right-3 top-3 z-30 flex items-center gap-2">
          <button
            onClick={() => navigate(`/transporter/jobs/${id}`)}
            aria-label="Back to booking"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-lg"
          >
            <ArrowLeft className="h-5 w-5 text-[#0F2238]" />
          </button>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold shadow-lg">
            {live ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-emerald-700">Sharing live location</span>
              </>
            ) : request.paused ? (
              <>
                <Pause className="h-3 w-3 text-amber-600" /> <span className="text-amber-700">Paused</span>
              </>
            ) : (
              <>
                <Radio className="h-3 w-3 text-neutral-500" /> <span className="text-neutral-600">Not sharing</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="-mt-5 flex-1 space-y-3 rounded-t-3xl bg-[#F6F4EF] px-4 pb-6 pt-4 shadow-[0_-6px_16px_rgba(0,0,0,0.08)]">
        <div className="mx-auto h-1 w-10 rounded-full bg-neutral-300" />

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#C28D2E]">
            {finished
              ? "Trip completed"
              : run
                ? run.started && nextStop
                  ? `Stop ${nextStop.position} of ${run.totalStops} · ${run.next.label}`
                  : `Shared trip · ${run.customers} customers`
                : STATUS_TEXT[stage] || "Booking"}
          </p>
          {target ? (
            <>
              <p className="mt-1 text-2xl font-extrabold text-[#0F2238]">
                {eta || (legKm != null ? `${legKm.toFixed(1)} km` : "Locating you...")}
              </p>
              {eta && legKm != null && <p className="text-xs font-semibold text-neutral-500">{legKm.toFixed(1)} km to {to === "pickup" ? "pickup" : "drop-off"}</p>}
              <p className="mt-2 line-clamp-2 text-[13px] text-neutral-600">{target.address}</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-neutral-600">
              {finished ? (run ? "All customers delivered." : "The horse has been delivered.") : "Start the trip to begin."}
            </p>
          )}
          {lastSentAt && live && (
            <p className="mt-2 text-[11px] text-neutral-400">
              Customer last updated {lastSentAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            {target && (
              <a
                href={directionsUrl(target.lat, target.lng)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#0B1C33] py-2.5 text-sm font-bold text-white"
              >
                <Navigation className="h-4 w-4" /> Navigate
              </a>
            )}
            {user.phone && (
              <a href={`tel:${user.phone}`} className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white">
                <Phone className="h-4 w-4" /> Call {user.name?.split(" ")[0] || "customer"}
              </a>
            )}
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-50 p-3 text-xs text-destructive">{error}</p>}

        {notStarted && (
          <div className="space-y-2">
            <button
              onClick={() => runAction({ action: "start" })}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C28D2E] py-3.5 text-sm font-bold text-white disabled:opacity-50"
            >
              <Route className="h-4 w-4" />{" "}
              {busy ? "Starting..." : run ? `Start trip for all ${run.customers} customers` : "Start trip & share location"}
            </button>
            {(!request.vehicle || !request.driver) && (
              <p className="text-center text-[11px] text-neutral-500">
                Assign a vehicle and driver first on the{" "}
                <Link to={`/transporter/jobs/${id}`} className="font-bold text-[#C28D2E] underline">
                  booking page
                </Link>
                .
              </p>
            )}
          </div>
        )}

        {run && run.started && run.next && nextStop && (
          <OtpStep
            title={run.next.kind === "pickup" ? `Reached ${nextStop.name.split(" ")[0]}?` : `Reached ${nextStop.name.split(" ")[0]}'s drop-off?`}
            hint={
              run.next.kind === "pickup"
                ? `Ask ${nextStop.name.split(" ")[0]} for the pickup OTP shown in their app.`
                : `Ask ${nextStop.name.split(" ")[0]} for the delivery OTP to hand over their horse.`
            }
            value={otp}
            onChange={setOtp}
            onSubmit={() => runAction({ action: run.next.kind === "pickup" ? "verify_pickup" : "verify_drop", otp }, run.next.requestId)}
            busy={busy}
            cta={run.next.kind === "pickup" ? "Verify pickup OTP" : "Verify delivery OTP"}
          />
        )}

        {!run && request.status === "accepted" && stage === "to_pickup" && (
          <OtpStep
            title="Reached the pickup?"
            hint="Ask the customer for the pickup OTP shown in their app."
            value={otp}
            onChange={setOtp}
            onSubmit={() => runAction({ action: "verify_pickup", otp })}
            busy={busy}
            cta="Verify pickup OTP"
          />
        )}

        {!run && request.status === "accepted" && stage === "in_transit" && (
          <OtpStep
            title="Reached the drop-off?"
            hint="Ask for the delivery OTP to complete the trip."
            value={otp}
            onChange={setOtp}
            onSubmit={() => runAction({ action: "verify_drop", otp })}
            busy={busy}
            cta="Verify delivery OTP"
          />
        )}

        {finished && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <p className="text-sm font-bold text-[#0F2238]">Trip completed. Location sharing has stopped.</p>
            <Link to={`/transporter/jobs/${id}`} className="text-xs font-bold text-[#C28D2E]">
              View booking summary
            </Link>
          </div>
        )}

        {request.paused && (
          <p className="rounded-xl bg-amber-50 p-3 text-center text-xs text-amber-800">
            The trip is paused, so your location is not being shared. Resume it from the booking page.
          </p>
        )}
      </div>
    </div>
  )
}
