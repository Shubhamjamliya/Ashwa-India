import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import { Calendar, ChevronRight, MapPin, Phone, Radar, Star, Truck, Users } from "lucide-react"
import { apiFetch, getSession } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import BackButton from "../components/BackButton"
import { CancelPending, RateTrip, STAGE_TEXT, STATUS_META, dateLabel, fmt, pendingText } from "../components/TransportBookingParts"

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")

// Another customer asks to share one of this user's accepted rides.
function ShareRequestCard({ ask, onAnswered }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const answer = async (action) => {
    setBusy(true)
    setError("")
    try {
      await apiFetch(`/transport/requests/${ask._id}/share-consent`, { method: "PATCH", body: { action } })
      onAnswered(ask._id)
    } catch (err) {
      setError(err.message || "Could not send your answer")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <p className="flex items-center gap-1.5 text-sm font-bold text-blue-900">
        <Users className="h-4 w-4" /> Share your ride?
      </p>
      <p className="mt-1 text-xs text-blue-900">
        A customer wants to share your transport on {dateLabel(ask.scheduledDate)} with {ask.animals} animal(s).
      </p>
      <p className="mt-1 flex items-start gap-1.5 text-[11px] text-blue-800">
        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
        {ask.source.address} → {ask.destination.address}
      </p>
      {ask.newAmount != null && ask.newAmount < ask.currentAmount && (
        <p className="mt-2 text-xs text-blue-900">
          Your price drops from <span className="line-through">{fmt(ask.currentAmount)}</span>{" "}
          <span className="font-extrabold text-emerald-700">to about {fmt(ask.newAmount)}</span> if the transporter accepts.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button onClick={() => answer("decline")} disabled={busy} className="flex-1 rounded-xl bg-white py-2.5 text-sm font-bold text-[#0F2238] disabled:opacity-50">
          Decline
        </button>
        <button onClick={() => answer("approve")} disabled={busy} className="flex-1 rounded-xl bg-blue-700 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          Agree to share
        </button>
      </div>
    </div>
  )
}
function TransportBookings() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [shareRequests, setShareRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () =>
    apiFetch("/transport/requests/mine")
      .then((data) => {
        setRequests(data.requests || [])
        setShareRequests(data.shareRequests || [])
      })
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
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
    const onShareRequest = () => load()
    socket.on("transport:update", onUpdate)
    socket.on("transport:location", onLocation)
    socket.on("transport:share-request", onShareRequest)
    return () => {
      socket.off("transport:update", onUpdate)
      socket.off("transport:location", onLocation)
      socket.off("transport:share-request", onShareRequest)
      socket.disconnect()
    }
  }, [])

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : requests.length === 0 && shareRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-8 py-20 text-center">
          <Calendar className="h-8 w-8 text-neutral-400" />
          <p className="text-base font-semibold text-[#0F2238]">No bookings yet</p>
          <p className="text-[13px] text-neutral-500">Your transport bookings will show up here.</p>
        </div>
      ) : (
        <div className="space-y-2.5 px-4 pb-4">
          {shareRequests.map((ask) => (
            <ShareRequestCard
              key={ask._id}
              ask={ask}
              onAnswered={(id) => {
                setShareRequests((prev) => prev.filter((a) => a._id !== id))
                load()
              }}
            />
          ))}
          {requests.map((item) => {
            const meta = STATUS_META[item.status] || STATUS_META.pending
            const StatusIcon = meta.icon
            const active = item.status === "accepted"
            return (
              <div key={item._id} className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
                <button
                  type="button"
                  onClick={() => navigate(`/user/bookings/${item._id}`)}
                  className="block w-full text-left"
                  aria-label="Open booking details"
                >
                <div className="flex items-center justify-between gap-2">
                  <p className="flex flex-1 items-center gap-1.5 truncate text-sm font-bold text-[#0F2238]">
                    {item.vehicleTypeInfo?.icon ? (
                      <img src={getMediaUrl(item.vehicleTypeInfo.icon)} alt="" className="h-5 w-5 shrink-0 object-contain" />
                    ) : (
                      <Truck className="h-4 w-4 shrink-0 text-[#C28D2E]" />
                    )}
                    <span className="truncate">
                      {item.transporter ? item.transporter.businessName || item.transporter.name || "Transporter" : "Finding a transporter"}
                    </span>
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
                  <span>
                    {item.vehicleTypeInfo?.name ? `${item.vehicleTypeInfo.name} · ` : ""}
                    {item.type === "shared" || item.sharedGroup ? "Shared ride" : "Private"}
                    {item.scheduledDate ? ` · ${dateLabel(item.scheduledDate)}` : ""}
                    {item.animals > 1 ? ` · ${item.animals} animals` : ""}
                  </span>
                  <span className="flex items-center gap-0.5 font-extrabold text-[#C28D2E]">
                    {fmt(item.quote?.amount)}
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                  </span>
                </div>
                </button>
                {item.advance?.amount > 0 && (
                  <p className="mt-1 text-[11px] text-neutral-500">
                    {item.advance.status === "refunded"
                      ? `Advance ${fmt(item.advance.amount)} refunded to your wallet`
                      : `Advance paid ${fmt(item.advance.amount)} · ${fmt(Math.max(0, (item.quote?.amount || 0) - item.advance.amount))} at delivery`}
                  </p>
                )}
                {item.status === "pending" && pendingText(item) && <p className="mt-1 text-[11px] font-semibold text-amber-700">{pendingText(item)}</p>}
                {(item.status === "rejected" || item.status === "cancelled") && item.rejectReason && (
                  <p className="mt-1 text-[11px] text-red-600">{item.rejectReason}</p>
                )}
                {item.status === "pending" && (
                  <CancelPending id={item._id} onCancelled={(updated) => setRequests((prev) => prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)))} />
                )}
                {active && (
                  <div className="mt-3 space-y-2 border-t border-[#E4E1D8] pt-3">
                    {item.stage && <p className="text-xs text-neutral-600">{STAGE_TEXT[item.stage]}</p>}
                    <button
                      onClick={() => navigate(`/user/bookings/${item._id}`)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0B1C33] py-2.5 text-sm font-bold text-white"
                    >
                      <Radar className="h-4 w-4" />
                      {item.stage === "to_pickup" || item.stage === "in_transit" ? "Track live" : "View details & OTP"}
                    </button>
                  </div>
                )}
                {item.status === "completed" && <RateTrip requestId={item._id} reviewed={item.reviewed} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const SERVICE_STATUS = {
  pending: { label: "Waiting for response", color: "#f59e0b" },
  accepted: { label: "Accepted", color: "#16a34a" },
  completed: { label: "Completed", color: "#0B1C33" },
  rejected: { label: "Declined", color: "#ef4444" },
  cancelled: { label: "Cancelled", color: "#64748B" },
}

function ServiceBookings() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch("/services/requests/mine")
      .then((data) => setRequests(data.requests || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const { accessToken } = getSession("user")
    if (!accessToken) return
    const socket = io(SOCKET_URL, { auth: { token: accessToken }, transports: ["websocket", "polling"] })
    const onUpdate = (updated) => setRequests((prev) => prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)))
    socket.on("service:update", onUpdate)
    return () => {
      socket.off("service:update", onUpdate)
      socket.disconnect()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
      </div>
    )
  }
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-8 py-20 text-center">
        <Calendar className="h-8 w-8 text-neutral-400" />
        <p className="text-base font-semibold text-[#0F2238]">No service bookings yet</p>
        <p className="text-[13px] text-neutral-500">Book a service from the Services tile on Home.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 px-4 pb-4">
      {requests.map((item) => {
        const meta = SERVICE_STATUS[item.status] || SERVICE_STATUS.pending
        return (
          <div key={item._id} className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-bold capitalize text-[#0F2238]">{item.serviceType}</p>
              <span className="shrink-0 rounded-full px-2 py-1 text-[11px] font-bold" style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}>
                {meta.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-600">{item.provider?.businessName || item.provider?.name || "Provider"}</p>
            {item.message && <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{item.message}</p>}
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-neutral-500">
              <span>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              {item.amount ? <span className="font-extrabold text-[#C28D2E]">₹{item.amount.toLocaleString("en-IN")}</span> : null}
            </div>
            {item.status === "accepted" && item.provider?.phone && (
              <a href={`tel:${item.provider.phone}`} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white">
                <Phone className="h-4 w-4" /> Call provider
              </a>
            )}
            {item.status === "completed" && <RateService requestId={item._id} />}
          </div>
        )
      })}
    </div>
  )
}

export default function Bookings() {
  const [tab, setTab] = useState("transport")
  return (
    <div>
      <div className="sticky top-0 z-30 flex items-center gap-2 bg-[#0B1C33] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <BackButton variant="dark" />
        <h1 className="text-[17px] font-bold text-white">My Bookings</h1>
      </div>
      <div className="flex gap-1.5 px-4 pb-3 pt-3">
        {[
          { key: "transport", label: "Transport" },
          { key: "services", label: "Services" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-bold ${tab === t.key ? "bg-[#0B1C33] text-white" : "border border-[#E4E1D8] bg-white text-neutral-600"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "transport" ? <TransportBookings /> : <ServiceBookings />}
    </div>
  )
}


function RateService({ requestId }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    setSaving(true)
    setError("")
    try {
      await apiFetch(`/services/requests/${requestId}/review`, { method: "POST", body: { rating, comment } })
      setDone(true)
    } catch (err) {
      setError(err.message || "Could not save your review")
    } finally {
      setSaving(false)
    }
  }

  if (done) return <p className="mt-3 text-center text-xs font-bold text-emerald-700">Thanks for rating this service</p>

  return (
    <div className="mt-3 space-y-2 border-t border-[#E4E1D8] pt-3">
      <p className="text-xs font-bold text-[#0F2238]">How was the service?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
            <Star className={`h-6 w-6 ${n <= rating ? "fill-[#C28D2E] text-[#C28D2E]" : "text-neutral-300"}`} />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Share a few words (optional)"
            className="w-full resize-none rounded-xl border border-[#E4E1D8] px-3 py-2 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button onClick={submit} disabled={saving} className="w-full rounded-xl bg-[#0B1C33] py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Submit rating"}
          </button>
        </>
      )}
    </div>
  )
}
