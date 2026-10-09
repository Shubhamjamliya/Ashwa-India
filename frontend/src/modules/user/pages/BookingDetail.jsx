import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { io } from "socket.io-client"
import { CheckCircle2, Clock, MapPin, Phone, Truck, User as UserIcon } from "lucide-react"
import { apiFetch, getSession } from "@/shared/lib/api"
import { distanceKm } from "@/shared/lib/geo"
import { getMediaUrl } from "@/shared/lib/media"
import TripMap, { targetFor } from "@/shared/maps/TripMap"
import BackButton from "../components/BackButton"
import { CancelPending, OtpCard, RateTrip, STAGE_TEXT, STATUS_META, dateLabel, fmt, pendingText, timeOf } from "../components/TransportBookingParts"

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")
const TRAIL_STEP_KM = 0.02
// A position older than this is shown as possibly out of date.
const STALE_MS = 2 * 60 * 1000

const STAGES = [
  { key: "scheduled", label: "Confirmed" },
  { key: "to_pickup", label: "On the way" },
  { key: "in_transit", label: "Horse on board" },
  { key: "delivered", label: "Delivered" },
]

const formatEta = (min) => (min == null ? null : min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`)

function Stepper({ stage }) {
  const current = STAGES.findIndex((s) => s.key === stage)
  return (
    <div className="flex items-start">
      {STAGES.map((s, i) => {
        const done = i <= current
        return (
          <div key={s.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : i <= current ? "bg-emerald-500" : "bg-[#E4E1D8]"}`} />
              <span className={`h-3 w-3 shrink-0 rounded-full ${done ? "bg-emerald-500" : "bg-[#E4E1D8]"} ${i === current ? "ring-4 ring-emerald-100" : ""}`} />
              <span className={`h-0.5 flex-1 ${i === STAGES.length - 1 ? "bg-transparent" : i < current ? "bg-emerald-500" : "bg-[#E4E1D8]"}`} />
            </div>
            <p className={`mt-1.5 text-center text-[10px] font-semibold ${done ? "text-[#0F2238]" : "text-neutral-400"}`}>{s.label}</p>
          </div>
        )
      })}
    </div>
  )
}

// One transport booking: live in-app tracking with the road route, plus OTPs, crew and payment.
export default function BookingDetail() {
  const { id } = useParams()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [route, setRoute] = useState(null)
  const [, setTick] = useState(0)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/transport/requests/mine/${id}`)
      setRequest(data.request)
    } catch (err) {
      setError(err.message || "Could not load this booking")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Live updates: status changes and the vehicle's position.
  useEffect(() => {
    const { accessToken } = getSession("user")
    if (!accessToken) return
    const socket = io(SOCKET_URL, { auth: { token: accessToken }, transports: ["websocket", "polling"] })
    const onUpdate = (updated) => {
      if (updated._id !== id) return
      setRequest((prev) =>
        prev
          ? {
              ...prev,
              ...updated,
              // Socket payloads never carry OTPs, the trail or the crew details; keep what we already have.
              pickupOtp: updated.pickupOtp ?? prev.pickupOtp,
              dropOtp: updated.dropOtp ?? prev.dropOtp,
              trail: prev.trail,
              vehicle: typeof updated.vehicle === "object" && updated.vehicle ? updated.vehicle : prev.vehicle,
              driver: typeof updated.driver === "object" && updated.driver ? updated.driver : prev.driver,
            }
          : prev
      )
      // A newly accepted booking needs its OTPs and crew, which only the detail endpoint returns.
      if (updated.status === "accepted") load()
    }
    const onLocation = ({ requestId, lat, lng, heading, updatedAt }) => {
      if (requestId !== id) return
      setRequest((prev) => {
        if (!prev) return prev
        const trail = prev.trail || []
        const last = trail[trail.length - 1]
        const point = { lat, lng }
        return {
          ...prev,
          transporterLocation: { lat, lng, heading, updatedAt },
          trail: !last || distanceKm(last, point) >= TRAIL_STEP_KM ? [...trail, point] : trail,
        }
      })
    }
    socket.on("transport:update", onUpdate)
    socket.on("transport:location", onLocation)
    return () => {
      socket.off("transport:update", onUpdate)
      socket.off("transport:location", onLocation)
      socket.disconnect()
    }
  }, [id, load])

  // Re-render every 30s so "updated x min ago" and the stale warning stay current.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
      </div>
    )
  }
  if (!request) {
    return (
      <div className="flex flex-col items-center gap-3 px-8 py-24 text-center">
        <p className="text-sm text-destructive">{error || "Booking not found"}</p>
        <Link to="/user/bookings" className="text-sm font-bold text-[#C28D2E]">
          Back to my bookings
        </Link>
      </div>
    )
  }

  const meta = STATUS_META[request.status] || STATUS_META.pending
  const StatusIcon = meta.icon
  const stage = request.status === "completed" ? "delivered" : request.stage
  const onRoad = request.status === "accepted" && (stage === "to_pickup" || stage === "in_transit")
  const loc = request.transporterLocation
  const hasLoc = onRoad && loc?.lat != null
  const to = targetFor(stage)
  const updatedAgo = loc?.updatedAt ? Date.now() - new Date(loc.updatedAt).getTime() : null
  const stale = hasLoc && updatedAgo != null && updatedAgo > STALE_MS
  const target = to === "pickup" ? request.source : request.destination
  const legKm = route?.to === to ? route.distanceKm : hasLoc ? distanceKm(loc, target) : null
  const eta = route?.road && route.to === to ? formatEta(route.durationMin) : null
  const transporter = request.transporter
  const advance = request.advance?.amount || 0
  const fare = request.quote?.amount || 0

  return (
    <div className="pb-8">
      <div className="sticky top-0 z-30 flex items-center gap-2 bg-[#0B1C33] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <BackButton variant="dark" />
        <div className="min-w-0 flex-1">
          <h1 className="text-[17px] font-bold text-white">Booking details</h1>
          <p className="truncate text-xs text-white/60">
            {request.vehicleTypeInfo?.name ? `${request.vehicleTypeInfo.name} · ` : ""}
            {request.scheduledDate ? dateLabel(request.scheduledDate) : "Transport"}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold" style={{ backgroundColor: `${meta.color}33`, color: "#fff" }}>
          <StatusIcon className="h-3 w-3" /> {meta.label}
        </span>
      </div>

      {/* Live map */}
      <div className="relative">
        <TripMap
          pickup={request.source}
          drop={request.destination}
          vehicle={hasLoc ? loc : null}
          trail={request.trail || []}
          stage={stage}
          onRoute={(r) => setRoute((prev) => (r.estimate && prev?.road && prev.to === r.to ? prev : r))}
          follow={hasLoc}
          className="h-[45vh]"
        />
      </div>

      <div className="-mt-4 relative z-10 space-y-3 px-4">
        {/* Where it is now */}
        <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4 shadow-md">
          {onRoad ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#C28D2E]">
                {stage === "to_pickup" ? "Transporter on the way to you" : "Your horse is on the way"}
              </p>
              {hasLoc ? (
                <>
                  <p className="mt-1 text-2xl font-extrabold text-[#0F2238]">
                    {eta ? `${stage === "to_pickup" ? "Arriving" : "Reaching"} in ${eta}` : legKm != null ? `${legKm.toFixed(1)} km away` : "Live"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {legKm != null && eta ? `${legKm.toFixed(1)} km to ${stage === "to_pickup" ? "pickup" : "drop-off"} · ` : ""}
                    {loc.updatedAt ? `updated ${timeOf(loc.updatedAt)}` : "live"}
                  </p>
                  {stale && (
                    <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800">
                      <Clock className="h-3.5 w-3.5" /> No update for a few minutes. The transporter may have weak signal.
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm text-neutral-600">Waiting for the transporter's live location...</p>
              )}
            </>
          ) : (
            <p className="text-sm font-semibold text-[#0F2238]">
              {request.status === "accepted" ? STAGE_TEXT[stage] : request.status === "completed" ? "Delivered. Thanks for riding with us." : pendingText(request) || request.rejectReason || meta.label}
            </p>
          )}
          {(request.status === "accepted" || request.status === "completed") && (
            <div className="mt-4">
              <Stepper stage={stage} />
            </div>
          )}
          {request.paused && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-center text-[11px] font-semibold text-amber-800">The transporter has paused this trip.</p>}
        </div>

        {/* OTPs */}
        {request.status === "accepted" && !request.pickupVerifiedAt && request.pickupOtp && (
          <OtpCard label="Pickup OTP" code={request.pickupOtp} hint="Share this with the transporter when they reach you." />
        )}
        {request.status === "accepted" && stage === "in_transit" && request.dropOtp && (
          <OtpCard label="Delivery OTP" code={request.dropOtp} hint="Share this at the drop-off to complete the trip." />
        )}

        {/* Crew */}
        {transporter && (
          <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F6E9C9]">
                {request.vehicleTypeInfo?.icon ? (
                  <img src={getMediaUrl(request.vehicleTypeInfo.icon)} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <Truck className="h-5 w-5 text-[#C28D2E]" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#0F2238]">{transporter.businessName || transporter.name || "Transporter"}</p>
                <p className="text-xs text-neutral-500">
                  {request.vehicle?.registrationNumber ? `${request.vehicle.registrationNumber} · ` : ""}
                  {request.vehicleTypeInfo?.name || "Vehicle"}
                </p>
              </div>
              {transporter.phone && request.status === "accepted" && (
                <a href={`tel:${transporter.phone}`} aria-label="Call transporter" className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600">
                  <Phone className="h-4 w-4 text-white" />
                </a>
              )}
            </div>
            {request.driver?.name && (
              <div className="flex items-center gap-3 border-t border-[#F1EEE6] pt-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1EEE6]">
                  <UserIcon className="h-4 w-4 text-[#0F2238]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-neutral-500">Driver</p>
                  <p className="truncate text-sm font-semibold text-[#0F2238]">{request.driver.name}</p>
                </div>
                {request.driver.phone && request.status === "accepted" && (
                  <a href={`tel:${request.driver.phone}`} className="rounded-full border border-emerald-600 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    Call driver
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Route */}
        <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <div className="flex gap-3">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-emerald-500 bg-white" />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Pickup</p>
              <p className="text-[13px] text-[#0F2238]">{request.source.address}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">Drop-off</p>
              <p className="text-[13px] text-[#0F2238]">{request.destination.address}</p>
            </div>
          </div>
          <p className="border-t border-[#F1EEE6] pt-3 text-xs text-neutral-500">
            {request.quote?.tripKm} km · {request.animals || 1} horse{request.animals > 1 ? "s" : ""} · {request.type === "shared" || request.sharedGroup ? "Shared ride" : "Private"}
          </p>
        </div>

        {/* Payment */}
        <div className="space-y-1.5 rounded-2xl border border-[#E4E1D8] bg-white p-4 text-[13px]">
          <div className="flex justify-between">
            <span className="text-neutral-500">Fare</span>
            <span className="font-bold text-[#0F2238]">{fmt(fare)}</span>
          </div>
          {advance > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-neutral-500">{request.advance.status === "refunded" ? "Advance (refunded to wallet)" : "Advance paid"}</span>
                <span className={`font-bold ${request.advance.status === "refunded" ? "text-neutral-400 line-through" : "text-emerald-700"}`}>{fmt(advance)}</span>
              </div>
              {request.advance.status !== "refunded" && (
                <div className="flex justify-between border-t border-[#F1EEE6] pt-1.5">
                  <span className="font-semibold text-[#0F2238]">Pay at delivery</span>
                  <span className="font-extrabold text-[#C28D2E]">{fmt(Math.max(0, fare - advance))}</span>
                </div>
              )}
            </>
          )}
        </div>

        {request.status === "pending" && (
          <CancelPending id={request._id} onCancelled={(updated) => setRequest((prev) => ({ ...prev, ...updated }))} />
        )}

        {request.status === "completed" && (
          <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Delivered
            </p>
            <RateTrip requestId={request._id} reviewed={request.reviewed} />
          </div>
        )}
      </div>
    </div>
  )
}
