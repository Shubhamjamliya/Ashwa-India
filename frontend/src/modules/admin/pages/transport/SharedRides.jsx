import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Phone,
  RefreshCw,
  Route,
  Search,
  Truck,
  UserRound,
  Users,
} from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

const money = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`
const dateLabel = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—")
const REFRESH_MS = 30000

const STATES = {
  upcoming: { label: "Upcoming", badge: "bg-blue-50 text-blue-700 border-blue-200", bar: "bg-blue-500" },
  on_trip: { label: "On trip", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" },
  completed: { label: "Completed", badge: "bg-neutral-100 text-neutral-700 border-neutral-200", bar: "bg-neutral-400" },
  waiting: { label: "Awaiting confirmation", badge: "bg-amber-50 text-amber-700 border-amber-200", bar: "bg-amber-400" },
  cancelled: { label: "Cancelled", badge: "bg-rose-50 text-rose-700 border-rose-200", bar: "bg-rose-400" },
}

const TABS = [
  { key: "", label: "All" },
  { key: "on_trip", label: "On trip" },
  { key: "upcoming", label: "Upcoming" },
  { key: "waiting", label: "Awaiting" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
]

const CUSTOMER_STATUS = {
  pending: { label: "Awaiting", className: "bg-amber-50 text-amber-700" },
  accepted: { label: "Confirmed", className: "bg-blue-50 text-blue-700" },
  completed: { label: "Delivered", className: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Declined", className: "bg-rose-50 text-rose-700" },
  cancelled: { label: "Cancelled", className: "bg-neutral-100 text-neutral-600" },
}

function customerStatus(c) {
  if (c.status === "pending" && c.shareApproval === "pending") return { label: "Awaiting first customer", className: "bg-amber-50 text-amber-700" }
  if (c.status === "accepted" && c.stage === "in_transit") return { label: "On board", className: "bg-emerald-50 text-emerald-700" }
  if (c.status === "accepted" && c.stage === "to_pickup") return { label: "Waiting for pickup", className: "bg-sky-50 text-sky-700" }
  return CUSTOMER_STATUS[c.status] || CUSTOMER_STATUS.pending
}

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xl font-extrabold text-neutral-900">{value}</p>
        <p className="text-xs font-medium text-neutral-500">{label}</p>
      </div>
    </div>
  )
}

function RunCard({ run, open, onToggle }) {
  const state = STATES[run.state] || STATES.upcoming
  const progress = run.stopsTotal ? (run.stopsDone / run.stopsTotal) * 100 : 0
  const confirmed = run.customers.filter((c) => ["accepted", "completed"].includes(c.status))

  return (
    <li className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${state.bar}`} />
      <button type="button" onClick={onToggle} aria-expanded={open} className="block w-full p-5 pl-6 text-left hover:bg-neutral-50/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="flex items-center gap-1.5 text-base font-bold text-neutral-900">
                <Route className="h-4 w-4 text-neutral-400" />
                {run.from} <span className="text-neutral-400">→</span> {run.to}
              </p>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${state.badge}`}>{state.label}</span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> {dateLabel(run.date)}
              </span>
              <span className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" />
                {run.transporter?.name || "No transporter"}
                {run.vehicle?.registration ? ` · ${run.vehicle.registration}` : ""}
              </span>
              {run.driver && (
                <span className="flex items-center gap-1">
                  <UserRound className="h-3.5 w-3.5" /> {run.driver.name}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Customers</p>
              <p className="text-lg font-extrabold text-neutral-900">
                {confirmed.length}
                <span className="text-xs font-semibold text-neutral-400"> · {run.animals} horse{run.animals === 1 ? "" : "s"}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Fare total</p>
              <p className="text-lg font-extrabold text-neutral-900">{money(run.fareTotal)}</p>
            </div>
            <ChevronDown className={`h-5 w-5 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </div>

        {run.stopsTotal > 0 && run.state !== "cancelled" && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500">
              <span>{run.state === "completed" ? "All stops done" : run.next ? `Next: ${run.next}` : "Not started"}</span>
              <span>
                {run.stopsDone} of {run.stopsTotal} stops
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div className={`h-full rounded-full transition-all ${state.bar}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </button>

      {open && (
        <div className="grid gap-5 border-t border-neutral-100 bg-neutral-50/50 p-5 pl-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">Stops in road order</p>
            {run.stops.length === 0 ? (
              <p className="text-sm text-neutral-500">Stops appear once customers are confirmed.</p>
            ) : (
              <ol>
                {run.stops.map((s, i) => {
                  const Icon = s.done ? CheckCircle2 : s.kind === "pickup" ? ArrowUpCircle : ArrowDownCircle
                  return (
                    <li key={`${s.position}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <Icon className={`h-5 w-5 shrink-0 ${s.done ? "text-emerald-600" : s.isNext ? "text-amber-600" : "text-neutral-300"}`} />
                        {i < run.stops.length - 1 && <span className={`my-0.5 w-px flex-1 ${s.done ? "bg-emerald-300" : "bg-neutral-200"}`} />}
                      </div>
                      <div className="min-w-0 pb-3">
                        <p className={`text-sm ${s.done ? "text-neutral-400 line-through" : "font-semibold text-neutral-900"}`}>
                          {s.position}. {s.label}
                          {s.isNext && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 no-underline">Next</span>}
                        </p>
                        <p className="truncate text-xs text-neutral-500">{s.place}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
              <Users className="mr-1 inline h-3.5 w-3.5" /> Customers
            </p>
            <ul className="space-y-2">
              {run.customers.map((c) => {
                const st = customerStatus(c)
                return (
                  <li key={c.requestId} className="rounded-xl border border-neutral-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-bold text-neutral-900">
                        {c.name}
                        {c.isHost && <span className="ml-2 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-white">First booking</span>}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.className}`}>{st.label}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-neutral-500">
                      {String(c.pickup || "").split(",")[0]} → {String(c.drop || "").split(",")[0]} · {c.animals} horse{c.animals === 1 ? "" : "s"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-neutral-600">
                        Fare <b className="text-neutral-900">{money(c.fare)}</b>
                        {c.advance > 0 && <span className="text-neutral-400"> · advance {money(c.advance)}</span>}
                      </span>
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 font-semibold text-neutral-700 hover:text-neutral-900">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            {run.transporter?.phone && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500">
                <Truck className="h-3.5 w-3.5" /> {run.transporter.name}:{" "}
                <a href={`tel:${run.transporter.phone}`} className="font-semibold text-neutral-800">
                  {run.transporter.phone}
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

export default function AdminSharedRides() {
  const [data, setData] = useState({ runs: [], counts: {}, totals: {} })
  const [tab, setTab] = useState("")
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [openId, setOpenId] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  const load = useCallback(
    async (quiet = false) => {
      if (quiet) setRefreshing(true)
      else setLoading(true)
      try {
        const params = new URLSearchParams()
        if (tab) params.set("state", tab)
        if (search) params.set("q", search)
        setData(await apiFetch(`/transport/shared-runs?${params}`))
        setError("")
        setUpdatedAt(new Date())
      } catch (err) {
        setError(err.message || "Failed to load shared rides")
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [tab, search]
  )

  useEffect(() => {
    load()
  }, [load])

  // Trips move while the admin watches: refresh quietly, but only while the tab is visible.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load(true)
    }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])

  // Search as you type, without a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 350)
    return () => clearTimeout(timer)
  }, [query])

  const counts = data.counts || {}
  const totals = data.totals || {}
  const tabCount = useMemo(() => (key) => (key ? counts[key] ?? 0 : Object.values(counts).reduce((a, b) => a + b, 0)), [counts])

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Shared Rides</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500">
              Trips where two or more customers share one vehicle on the same route. Follow each run, its stops in road order, and what every customer pays.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {updatedAt && (
              <span className="text-xs text-neutral-400">
                Updated {updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Route} label="Shared runs" value={loading ? "—" : totals.runs ?? 0} tone="bg-blue-50 text-blue-600" />
        <Stat icon={Truck} label="On the road now" value={loading ? "—" : counts.on_trip ?? 0} tone="bg-emerald-50 text-emerald-600" />
        <Stat icon={Users} label="Customers sharing" value={loading ? "—" : totals.customers ?? 0} tone="bg-violet-50 text-violet-600" />
        <Stat icon={CalendarDays} label="Fare value" value={loading ? "—" : money(totals.fareValue)} tone="bg-amber-50 text-amber-600" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-neutral-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key)
                setOpenId(null)
              }}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${tab === t.key ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-50"}`}
            >
              {t.label} <span className={tab === t.key ? "text-white/70" : "text-neutral-400"}>{loading ? "" : tabCount(t.key)}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, place, transporter, vehicle"
            className="h-10 w-full rounded-full border border-neutral-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-neutral-500">Loading shared rides...</p>
        </div>
      ) : data.runs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-20 text-center">
          <Users className="mx-auto h-9 w-9 text-neutral-300" />
          <p className="mt-3 text-sm font-semibold text-neutral-800">{tab || search ? "No shared rides match" : "No shared rides yet"}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {tab || search
              ? "Try another status or clear the search."
              : "When a customer joins another customer's booked ride on the same route, it shows up here."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.runs.map((run) => (
            <RunCard key={run.id} run={run} open={openId === run.id} onToggle={() => setOpenId(openId === run.id ? null : run.id)} />
          ))}
        </ul>
      )}
    </div>
  )
}
