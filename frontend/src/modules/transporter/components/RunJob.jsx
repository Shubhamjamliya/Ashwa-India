import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2, Circle, Navigation, Phone, Radar, Route, Users } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { directionsUrl } from "@/shared/lib/geo"
import TripMap from "@/shared/maps/TripMap"
import BackButton from "./BackButton"
import OtpStep from "./OtpStep"
import TripControls from "./TripControls"

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const place = (p) => String(p?.address || "").split(",")[0]

// A shared run, run as ONE trip: one status, one start, and the stops in road order
// (pick up first customer, pick up second, drop, drop). Only the next stop can be done.
export default function RunJob({ request, here, onChanged }) {
  const navigate = useNavigate()
  const run = request.sharedRun
  const [otp, setOtp] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const act = async (requestId, body) => {
    setBusy(true)
    setError("")
    try {
      await apiFetch(`/transport/requests/${requestId}/stage`, { method: "PATCH", body })
      setOtp("")
      await onChanged()
    } catch (err) {
      setError(err.message || "Action failed")
    } finally {
      setBusy(false)
    }
  }

  const next = run.next
  const nextStop = run.stops.find((s) => s.isNext)
  const total = run.members.reduce((s, m) => s + (m.fare || 0), 0)
  const status = run.finished ? "Trip completed" : run.started ? "On trip" : "Not started"
  const first = run.stops[0]?.point
  const last = run.stops[run.stops.length - 1]?.point

  return (
    <div className="min-h-screen pb-6">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <BackButton variant="dark" />
        <div className="min-w-0">
          <h1 className="text-[17px] font-bold text-white">Shared trip</h1>
          <p className="truncate text-xs text-[#A9B8CC]">
            {run.customers} customers · {run.animalsTotal} horses · {place(first)} → {place(last)}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* One status for the whole trip */}
        <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#C28D2E]">{status}</p>
            <p className="text-[11px] font-semibold text-neutral-500">
              {run.doneCount} of {run.totalStops} stops done
            </p>
          </div>
          <p className="mt-1 text-lg font-extrabold text-[#0F2238]">
            {run.finished ? "All customers delivered" : next ? `Next: ${next.label}` : "Ready to start"}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F1EEE6]">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(run.doneCount / run.totalStops) * 100}%` }} />
          </div>
        </div>

        {!run.finished && (
          <button
            onClick={() => navigate(`/transporter/track/${request._id}`)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B1C33] py-3.5 text-sm font-bold text-white shadow-md"
          >
            <Radar className="h-4 w-4" />
            {run.started ? "Open live tracking" : "Start tracking"}
          </button>
        )}

        {error && <p className="rounded-xl bg-red-50 p-3 text-xs text-destructive">{error}</p>}

        {/* The one thing to do now */}
        {!run.started && (
          <>
            <TripControls request={request} onUpdated={() => onChanged()} />
            <button
              onClick={() => act(request._id, { action: "start" })}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C28D2E] py-3.5 text-sm font-bold text-white disabled:opacity-50"
            >
              <Route className="h-4 w-4" /> {busy ? "Starting..." : `Start trip for all ${run.customers} customers`}
            </button>
          </>
        )}

        {run.started && next && nextStop && (
          <div className="space-y-3 rounded-2xl border-2 border-[#C28D2E] bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#C28D2E]">
                  Stop {nextStop.position} of {run.totalStops}
                </p>
                <p className="text-base font-extrabold text-[#0F2238]">{next.label}</p>
                <p className="mt-0.5 text-[12px] text-neutral-600">{next.point?.address}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={directionsUrl(next.point.lat, next.point.lng)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#0B1C33] py-2.5 text-xs font-bold text-white"
              >
                <Navigation className="h-3.5 w-3.5" /> Navigate
              </a>
              {nextStop.phone && (
                <a href={`tel:${nextStop.phone}`} className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white">
                  <Phone className="h-3.5 w-3.5" /> Call {nextStop.name.split(" ")[0]}
                </a>
              )}
            </div>
            <OtpStep
              title={next.kind === "pickup" ? `Reached ${nextStop.name.split(" ")[0]}?` : `Reached ${nextStop.name.split(" ")[0]}'s drop-off?`}
              hint={
                next.kind === "pickup"
                  ? `Ask ${nextStop.name.split(" ")[0]} for the pickup OTP shown in their app.`
                  : `Ask ${nextStop.name.split(" ")[0]} for the delivery OTP to hand over their horse.`
              }
              value={otp}
              onChange={setOtp}
              onSubmit={() => act(next.requestId, { action: next.kind === "pickup" ? "verify_pickup" : "verify_drop", otp })}
              busy={busy}
              cta={next.kind === "pickup" ? "Verify pickup OTP" : "Verify delivery OTP"}
            />
          </div>
        )}

        {run.started && !run.finished && <TripControls request={request} onUpdated={() => onChanged()} />}

        {run.finished && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <p className="text-base font-bold text-[#0F2238]">Shared trip completed</p>
            <p className="text-xs text-neutral-600">
              {run.customers} customers delivered · {fmt(total)} in fares. Each customer's payment is credited to your wallet after commission.
            </p>
          </div>
        )}

        {/* Stops in road order */}
        <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <p className="mb-3 text-sm font-bold text-[#0F2238]">Stops in order</p>
          <ol className="space-y-0">
            {run.stops.map((s, i) => {
              const Icon = s.done ? CheckCircle2 : s.kind === "pickup" ? ArrowUpCircle : ArrowDownCircle
              const tone = s.done ? "text-emerald-600" : s.isNext ? "text-[#C28D2E]" : "text-neutral-300"
              return (
                <li key={`${s.requestId}-${s.kind}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <Icon className={`h-5 w-5 shrink-0 ${tone}`} />
                    {i < run.stops.length - 1 && <span className={`my-0.5 w-px flex-1 ${s.done ? "bg-emerald-300" : "bg-[#E4E1D8]"}`} />}
                  </div>
                  <div className={`min-w-0 flex-1 pb-3 ${s.isNext ? "font-bold" : ""}`}>
                    <p className={`text-[13px] ${s.done ? "text-neutral-400 line-through" : "text-[#0F2238]"}`}>
                      {s.position}. {s.label}
                    </p>
                    <p className="truncate text-[11px] text-neutral-500">
                      {s.animals} horse{s.animals > 1 ? "s" : ""} · {s.point?.address}
                    </p>
                    {s.isNext && <p className="text-[10px] font-bold uppercase tracking-wide text-[#C28D2E]">Next stop</p>}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
          <TripMap
            pickup={first}
            drop={last}
            stops={run.stops}
            target={run.started && next ? { point: next.point, kind: next.kind === "pickup" ? "pickup" : "drop" } : null}
            vehicle={run.started && !run.finished ? here : null}
            trail={request.trail || []}
            stage={run.finished ? "delivered" : run.started ? "to_pickup" : "scheduled"}
            className="h-56"
          />
        </div>

        {/* Customers on this trip */}
        <div className="space-y-2 rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-[#0F2238]">
            <Users className="h-4 w-4 text-blue-700" /> Customers
          </p>
          {run.members.map((m) => (
            <div key={String(m.requestId)} className="flex items-center gap-3 rounded-xl bg-[#FAF7F1] p-3">
              <Circle className={`h-2.5 w-2.5 shrink-0 ${m.status === "completed" ? "fill-emerald-500 text-emerald-500" : m.stage === "in_transit" ? "fill-amber-500 text-amber-500" : "fill-neutral-300 text-neutral-300"}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-[#0F2238]">{m.name}</p>
                <p className="truncate text-[11px] text-neutral-500">
                  {place(m.pickup)} → {place(m.drop)} · {m.animals} horse{m.animals > 1 ? "s" : ""} · {fmt(m.fare)}
                </p>
                <p className="text-[10px] font-semibold text-neutral-500">
                  {m.status === "completed" ? "Delivered" : m.stage === "in_transit" ? "On board" : "Waiting for pickup"}
                </p>
              </div>
              {m.phone && m.status !== "completed" && (
                <a href={`tel:${m.phone}`} aria-label={`Call ${m.name}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600">
                  <Phone className="h-4 w-4 text-white" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
