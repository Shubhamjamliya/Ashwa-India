import { Calendar, ChevronRight, MapPin, Phone, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { bookingState } from "../lib/bookingStatus"

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const dateLabel = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
const place = (p) => String(p?.address || "").split(",")[0]

function Shell({ state, onOpen, children, footer }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white shadow-sm">
      <span className={`absolute inset-y-0 left-0 w-1 ${state.bar}`} />
      <button type="button" onClick={onOpen} className="block w-full p-4 pl-5 text-left">
        {children}
      </button>
      {footer}
    </div>
  )
}

// A shared run: one trip, several customers, one status from its next stop.
function RunCard({ trip }) {
  const navigate = useNavigate()
  const state = bookingState(trip)
  const { run, bookings } = trip
  const total = bookings.reduce((s, b) => s + (b.quote?.amount || 0), 0)
  const first = run.stops[0]?.point
  const last = run.stops[run.stops.length - 1]?.point

  return (
    <Shell state={state} onOpen={() => navigate(`/transporter/jobs/${trip.openId}`)}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm font-bold text-[#0F2238]">
          <Users className="h-4 w-4 shrink-0 text-blue-700" />
          Shared trip · {run.customers} customers
        </p>
        <span className={`max-w-[55%] shrink-0 truncate rounded-full px-2 py-0.5 text-[10px] font-bold ${state.chip}`}>{state.label}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
      </div>

      <p className="mt-1.5 truncate text-[12px] text-neutral-600">
        {place(first)} → {place(last)}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-neutral-500">{run.members.map((m) => m.name.split(" ")[0]).join(", ")}</p>

      {run.started && !run.finished && (
        <div className="mt-2.5">
          <div className="flex justify-between text-[10px] font-semibold text-neutral-500">
            <span>Stops</span>
            <span>
              {run.doneCount} of {run.totalStops} done
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#F1EEE6]">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(run.doneCount / run.totalStops) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-neutral-500">
        {trip.scheduledDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {dateLabel(trip.scheduledDate)}
          </span>
        )}
        <span>· {run.animalsTotal} horses</span>
        {trip.vehicleTypeInfo?.name && <span>· {trip.vehicleTypeInfo.name}</span>}
        <span className="ml-auto font-extrabold text-[#C28D2E]">{fmt(total)}</span>
      </div>
    </Shell>
  )
}

// One customer's booking.
function SingleCard({ req }) {
  const navigate = useNavigate()
  const state = bookingState(req)

  return (
    <Shell
      state={state}
      onOpen={() => navigate(`/transporter/jobs/${req._id}`)}
      footer={
        req.status === "accepted" &&
        req.user?.phone && (
          <a
            href={`tel:${req.user.phone}`}
            className="flex items-center justify-center gap-1 border-t border-[#F1EEE6] py-2 text-[11px] font-bold text-[#C28D2E]"
          >
            <Phone className="h-3 w-3" /> Call customer
          </a>
        )
      }
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-[#0F2238]">{req.user?.name || req.user?.phone || "Customer"}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${state.chip}`}>{state.label}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
      </div>

      <div className="mt-2.5 flex gap-2.5">
        <div className="flex flex-col items-center pt-1">
          <span className="h-2 w-2 rounded-full border-2 border-emerald-500 bg-white" />
          <span className="my-0.5 w-px flex-1 bg-[#E4E1D8]" />
          <MapPin className="h-3 w-3 text-rose-500" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-[12px] text-neutral-600">{req.source.address}</p>
          <p className="truncate text-[12px] text-neutral-600">{req.destination.address}</p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-neutral-500">
        {req.scheduledDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {dateLabel(req.scheduledDate)}
          </span>
        )}
        <span>· {req.animals || 1} horse{req.animals > 1 ? "s" : ""}</span>
        {req.vehicleTypeInfo?.name && <span>· {req.vehicleTypeInfo.name}</span>}
        <span className="ml-auto font-extrabold text-[#C28D2E]">{fmt(req.quote?.amount)}</span>
      </div>
    </Shell>
  )
}

// One trip on Home or the Bookings page: a single booking, or a whole shared run.
export default function BookingCard({ req }) {
  return req.isRun ? <RunCard trip={req} /> : <SingleCard req={req} />
}
