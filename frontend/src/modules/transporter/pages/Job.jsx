import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { CheckCircle2, MapPin, Navigation, Phone, Radar, Route, Users, XCircle } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { directionsUrl, distanceKm } from "@/shared/lib/geo"
import TripMap from "@/shared/maps/TripMap"
import BackButton from "../components/BackButton"
import OtpStep from "../components/OtpStep"
import RunJob from "../components/RunJob"
import TripControls from "../components/TripControls"

const LOCATION_PUSH_MS = 20000
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`

const STAGES = [
  { key: "scheduled", label: "Accepted" },
  { key: "to_pickup", label: "To pickup" },
  { key: "in_transit", label: "In transit" },
  { key: "delivered", label: "Delivered" },
]

function StageStepper({ stage }) {
  const current = STAGES.findIndex((s) => s.key === stage)
  return (
    <div className="flex items-center justify-between px-1">
      {STAGES.map((s, i) => {
        const done = i <= current
        return (
          <div key={s.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {i > 0 && <span className={`h-0.5 flex-1 ${i <= current ? "bg-emerald-500" : "bg-[#E4E1D8]"}`} />}
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-emerald-500 text-white" : "bg-[#E4E1D8] text-neutral-500"}`}>
                {i + 1}
              </span>
              {i < STAGES.length - 1 && <span className={`h-0.5 flex-1 ${i < current ? "bg-emerald-500" : "bg-[#E4E1D8]"}`} />}
            </div>
            <p className={`mt-1 text-center text-[10px] font-semibold ${done ? "text-[#0F2238]" : "text-neutral-400"}`}>{s.label}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function Job() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState("")
  const [here, setHere] = useState(null)
  const latestHere = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/transport/requests/${id}`)
      setRequest(data.request)
    } catch (err) {
      setError(err.message || "Failed to load booking")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const stage = request?.stage
  // A shared run with more than one customer is one trip, shown and driven by RunJob.
  const run = request?.sharedRun?.customers > 1 ? request.sharedRun : null
  const tracking = run
    ? run.started && !run.finished
    : request?.status === "accepted" && (stage === "to_pickup" || stage === "in_transit")
  // The run's location goes through the next stop's booking, which is always still on the road.
  const pushId = run ? run.next?.requestId : id
  const target = stage === "to_pickup" ? request?.source : stage === "in_transit" ? request?.destination : null

  // Share the transporter's live position with the user while the trip is active.
  useEffect(() => {
    if (!tracking || !navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        latestHere.current = point
        setHere(point)
      },
      () => setError("Allow location access so the user can track you."),
      { enableHighAccuracy: true, maximumAge: 10000 }
    )
    const pusher = setInterval(() => {
      if (!latestHere.current || !pushId) return
      apiFetch(`/transport/requests/${pushId}/location`, { method: "POST", body: latestHere.current }).catch(() => {})
    }, LOCATION_PUSH_MS)
    return () => {
      navigator.geolocation.clearWatch(watchId)
      clearInterval(pusher)
    }
  }, [tracking, pushId])

  // Accepting an open request can fail if another transporter got there first; declining it removes it from this transporter.
  const respond = async (action) => {
    if (action === "reject" && !window.confirm("Decline this request?")) return
    setBusy(true)
    setError("")
    try {
      const data = await apiFetch(`/transport/requests/${id}/respond`, { method: "PATCH", body: { action } })
      if (data.request?.declined) return navigate("/transporter", { replace: true })
      await load()
    } catch (err) {
      setError(err.message || "Could not update the request")
      // Someone else accepted it: there is nothing left to do here.
      if (/already accepted/i.test(err.message || "")) setTimeout(() => navigate("/transporter", { replace: true }), 1500)
    } finally {
      setBusy(false)
    }
  }

  const runAction = async (body) => {
    setBusy(true)
    setError("")
    try {
      const data = await apiFetch(`/transport/requests/${id}/stage`, { method: "PATCH", body })
      setRequest(data.request)
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
  if (!request) {
    return <p className="px-8 py-24 text-center text-sm text-destructive">{error || "Booking not found"}</p>
  }

  if (run && request.status !== "pending") return <RunJob request={request} here={here} onChanged={load} />

  const user = request.user || {}
  const distance = here && target ? distanceKm(here, target) : null
  const mapPoint = target || request.source
  const finished = request.status === "completed"

  return (
    <div className="min-h-screen pb-6">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <BackButton variant="dark" />
        <div className="min-w-0">
          <h1 className="text-[17px] font-bold text-white">Booking details</h1>
          <p className="text-xs text-[#A9B8CC]">{request.type === "shared" ? "Shared ride" : "Private transport"}</p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {request.status === "accepted" || finished ? (
          <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <StageStepper stage={finished ? "delivered" : stage} />
          </div>
        ) : null}

        {request.status === "pending" && (
          <div className="space-y-3 rounded-2xl border-2 border-[#C28D2E] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${request.hostRequest ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
                {request.hostRequest ? <Users className="h-3 w-3" /> : null}
                {request.hostRequest ? "Shared ride request" : "New request"}
              </span>
              {request.openOffer && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">First to accept gets it</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Travel date", request.scheduledDate ? new Date(`${request.scheduledDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Flexible"],
                ["Horses", request.animals || 1],
                ["Vehicle", request.vehicleTypeInfo?.name || "Any"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-[#F1EEE6] px-2 py-1.5">
                  <p className="text-[10px] font-semibold text-neutral-500">{label}</p>
                  <p className="truncate text-[12px] font-bold text-[#0F2238]">{value}</p>
                </div>
              ))}
            </div>
            {request.hostRequest && (
              <p className="rounded-lg bg-blue-50 p-2.5 text-[11px] text-blue-900">
                Joins your booking {request.hostRequest.source?.address?.split(",")[0]} → {request.hostRequest.destination?.address?.split(",")[0]}. The first
                customer agreed to share.
              </p>
            )}
            <div className="space-y-1 text-[12px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">{request.hostRequest ? "Customer's share" : "Fare"}</span>
                <span className="font-extrabold text-[#0F2238]">{fmt(request.quote?.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Advance paid</span>
                <span className="font-bold text-emerald-700">{fmt(request.advance?.status === "paid" ? request.advance.amount : 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Due at delivery</span>
                <span className="font-bold text-[#0F2238]">
                  {fmt(Math.max(0, (request.quote?.amount || 0) - (request.advance?.status === "paid" ? request.advance.amount : 0)))}
                </span>
              </div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => respond("reject")}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F1EEE6] py-3 text-sm font-bold text-[#0F2238] disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" /> Decline
              </button>
              <button
                onClick={() => respond("accept")}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" /> {busy ? "Please wait..." : "Accept"}
              </button>
            </div>
          </div>
        )}

        {request.status === "accepted" && (
          <button
            onClick={() => navigate(`/transporter/track/${id}`)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B1C33] py-3.5 text-sm font-bold text-white shadow-md"
          >
            <Radar className="h-4 w-4" />
            {tracking ? "Open live tracking" : "Start tracking"}
          </button>
        )}

        {error && request.status !== "pending" && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">User</p>
            <p className="truncate text-base font-bold text-[#0F2238]">{user.name || "User"}</p>
            <p className="text-xs text-neutral-500">{user.phone}</p>
          </div>
          {user.phone && (
            <a href={`tel:${user.phone}`} className="flex h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white">
              <Phone className="h-4 w-4" /> Call
            </a>
          )}
        </div>

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
          <div className="grid grid-cols-3 gap-2 border-t border-[#E4E1D8] pt-3 text-center">
            <div>
              <p className="text-[11px] text-neutral-500">Trip</p>
              <p className="text-sm font-bold text-[#0F2238]">{request.quote?.tripKm} km</p>
            </div>
            <div>
              <p className="text-[11px] text-neutral-500">Rate</p>
              <p className="text-sm font-bold text-[#0F2238]">₹{request.quote?.pricePerKm}/km</p>
            </div>
            <div>
              <p className="text-[11px] text-neutral-500">Amount</p>
              <p className="text-sm font-extrabold text-[#C28D2E]">{fmt(request.quote?.amount)}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
          <TripMap
            pickup={request.source}
            drop={request.destination}
            vehicle={tracking ? here : null}
            trail={request.trail || []}
            stage={finished ? "delivered" : stage}
            className="h-56"
          />
          <div className="flex items-center justify-between gap-2 p-3">
            <p className="text-xs text-neutral-500">
              {target ? (distance != null ? `${distance.toFixed(1)} km to ${stage === "to_pickup" ? "pickup" : "drop-off"}` : "Locating you...") : "Pickup and drop-off"}
            </p>
            <a
              href={directionsUrl(mapPoint.lat, mapPoint.lng)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-[#0B1C33] px-3 py-2 text-xs font-bold text-white"
            >
              <Navigation className="h-3.5 w-3.5" /> Navigate
            </a>
          </div>
        </div>

        {request.status === "accepted" && !finished && stage !== "delivered" && (
          <TripControls request={request} onUpdated={() => load()} />
        )}

        {request.status === "accepted" && stage === "scheduled" && (
          <button
            onClick={() => runAction({ action: "start" })}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C28D2E] py-3.5 text-sm font-bold text-white disabled:opacity-50"
          >
            <Route className="h-4 w-4" /> Start trip to pickup
          </button>
        )}

        {request.status === "accepted" && stage === "to_pickup" && (
          <OtpStep
            title="Reached the user?"
            hint="Ask the user for the pickup OTP shown in their app."
            value={otp}
            onChange={setOtp}
            onSubmit={() => runAction({ action: "verify_pickup", otp })}
            busy={busy}
            cta="Verify pickup OTP"
          />
        )}

        {request.status === "accepted" && stage === "in_transit" && (
          <OtpStep
            title="Reached the drop-off?"
            hint="Ask the user for the delivery OTP to complete the trip."
            value={otp}
            onChange={setOtp}
            onSubmit={() => runAction({ action: "verify_drop", otp })}
            busy={busy}
            cta="Verify delivery OTP"
          />
        )}

        {finished && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <p className="text-base font-bold text-[#0F2238]">Trip completed</p>
            <div className="mt-1 w-full space-y-1 rounded-xl bg-white p-3 text-left text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Booking amount</span>
                <span>{fmt(request.settlement?.grossAmount ?? request.quote?.amount)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Platform commission</span>
                <span>− {fmt(request.settlement?.commission)}</span>
              </div>
              <div className="flex justify-between border-t border-[#E4E1D8] pt-1 font-bold text-[#0F2238]">
                <span>Credited to your wallet</span>
                <span>{fmt(request.settlement?.netAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {(request.status === "rejected" || request.status === "cancelled") && (
          <p className="rounded-2xl bg-[#F1EEE6] p-4 text-center text-xs text-neutral-600">
            {request.status === "rejected" ? "This request was declined." : "This booking was cancelled."}
          </p>
        )}
      </div>
    </div>
  )
}

