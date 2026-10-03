import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import { Calendar, CheckCircle2, Clock, MapPin, Navigation, Phone, ShieldCheck, Truck, XCircle } from "lucide-react"
import { apiFetch, getSession } from "@/shared/lib/api"
import { directionsUrl, distanceKm, mapEmbedUrl } from "@/shared/lib/geo"
import BackButton from "../components/BackButton"

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")

const STATUS_META = {
  pending: { label: "Waiting for response", color: "#f59e0b", icon: Clock },
  accepted: { label: "Accepted", color: "#16a34a", icon: CheckCircle2 },
  completed: { label: "Delivered", color: "#0B1C33", icon: CheckCircle2 },
  rejected: { label: "Declined", color: "#ef4444", icon: XCircle },
  cancelled: { label: "Cancelled", color: "#64748B", icon: XCircle },
}

const STAGE_TEXT = {
  scheduled: "Booking confirmed. The transporter will start soon.",
  to_pickup: "The transporter is on the way to pick up your horse.",
  in_transit: "Your horse is on the way to the drop-off.",
  delivered: "Delivered.",
}

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const timeOf = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

function OtpCard({ label, code, hint }) {
  return (
    <div className="rounded-xl border border-dashed border-[#C28D2E] bg-[#FBF6EC] p-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-bold text-[#8A6416]">
          <ShieldCheck className="h-3.5 w-3.5" /> {label}
        </p>
        <p className="font-mono text-xl font-extrabold tracking-[0.3em] text-[#0F2238]">{code}</p>
      </div>
      <p className="mt-1 text-[11px] text-neutral-600">{hint}</p>
    </div>
  )
}

function ActiveDetails({ req }) {
  const stage = req.stage
  const pickupVerified = Boolean(req.pickupVerifiedAt)
  const loc = req.transporterLocation
  const showTracking = req.status === "accepted" && (stage === "to_pickup" || stage === "in_transit") && loc?.lat != null
  const target = stage === "to_pickup" ? req.source : stage === "in_transit" ? req.destination : null
  const away = showTracking && target ? distanceKm({ lat: loc.lat, lng: loc.lng }, target) : null

  return (
    <div className="mt-3 space-y-3 border-t border-[#E4E1D8] pt-3">
      {req.status === "accepted" && stage && <p className="text-xs text-neutral-600">{STAGE_TEXT[stage]}</p>}

      {req.status === "accepted" && !pickupVerified && req.pickupOtp && (
        <OtpCard label="Pickup OTP" code={req.pickupOtp} hint="Share this with the transporter when they reach you." />
      )}
      {req.status === "accepted" && stage === "in_transit" && req.dropOtp && (
        <OtpCard label="Delivery OTP" code={req.dropOtp} hint="Share this with the transporter at the drop-off to complete the trip." />
      )}

      {showTracking && (
        <div className="overflow-hidden rounded-xl border border-[#E4E1D8]">
          <iframe title="Transporter location" src={mapEmbedUrl(loc.lat, loc.lng)} className="h-44 w-full border-0" loading="lazy" />
          <div className="flex items-center justify-between gap-2 bg-white p-2.5">
            <p className="text-[11px] text-neutral-500">
              {away != null ? `${away.toFixed(1)} km to ${stage === "to_pickup" ? "you" : "drop-off"}` : "Live location"}
              {loc.updatedAt ? ` · updated ${timeOf(loc.updatedAt)}` : ""}
            </p>
            <a href={directionsUrl(loc.lat, loc.lng)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] font-bold text-[#C28D2E]">
              <Navigation className="h-3 w-3" /> Map
            </a>
          </div>
        </div>
      )}

      {req.status === "accepted" && req.transporter?.phone && (
        <a href={`tel:${req.transporter.phone}`} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white">
          <Phone className="h-4 w-4" /> Call transporter
        </a>
      )}
    </div>
  )
}

export default function Bookings() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch("/transport/requests/mine")
      .then((data) => setRequests(data.requests || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const { accessToken } = getSession("user")
    if (!accessToken) return
    const socket = io(SOCKET_URL, { auth: { token: accessToken }, transports: ["websocket", "polling"] })
    const onUpdate = (updated) => {
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? { ...r, ...updated, pickupOtp: updated.pickupOtp ?? r.pickupOtp, dropOtp: updated.dropOtp ?? r.dropOtp } : r)))
    }
    const onLocation = ({ requestId, lat, lng, updatedAt }) => {
      setRequests((prev) =>
        prev.map((r) => (r._id === requestId ? { ...r, transporterLocation: { lat, lng, updatedAt } } : r))
      )
    }
    socket.on("transport:update", onUpdate)
    socket.on("transport:location", onLocation)
    return () => {
      socket.off("transport:update", onUpdate)
      socket.off("transport:location", onLocation)
      socket.disconnect()
    }
  }, [])

  return (
    <div>
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <BackButton />
        <h1 className="text-[17px] font-bold text-[#0F2238]">Transport Requests</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-8 py-20 text-center">
          <Calendar className="h-8 w-8 text-neutral-400" />
          <p className="text-base font-semibold text-[#0F2238]">No bookings yet</p>
          <p className="text-[13px] text-neutral-500">Your transport bookings will show up here.</p>
        </div>
      ) : (
        <div className="space-y-2.5 px-4 pb-4">
          {requests.map((item) => {
            const meta = STATUS_META[item.status] || STATUS_META.pending
            const StatusIcon = meta.icon
            const active = item.status === "accepted"
            return (
              <div key={item._id} className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex flex-1 items-center gap-1.5 truncate text-sm font-bold text-[#0F2238]">
                    <Truck className="h-4 w-4 shrink-0 text-[#C28D2E]" />
                    <span className="truncate">{item.transporter?.businessName || item.transporter?.name || "Transporter"}</span>
                  </p>
                  <span
                    className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold"
                    style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {meta.label}
                  </span>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-neutral-500">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  {item.source.address} → {item.destination.address}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-neutral-500">
                  <span>{item.type === "shared" ? "Shared ride" : "Private transport"}</span>
                  <span className="font-extrabold text-[#C28D2E]">{fmt(item.quote?.amount)}</span>
                </div>
                {active && <ActiveDetails req={item} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
