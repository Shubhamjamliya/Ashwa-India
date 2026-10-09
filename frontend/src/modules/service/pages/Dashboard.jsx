import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import { Bell, Briefcase, CheckCircle2, ChevronRight, ClipboardList, Clock, MapPin, Phone, Star, Stethoscope, Wallet as WalletIcon, Wrench, XCircle, IndianRupee } from "lucide-react"
import { apiFetch, getSession } from "@/shared/lib/api"
import { useAuth } from "@/shared/context/AuthContext"

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")
const DISMISSED_KEY = "ashwa_provider_notifications_dismissed"
const LOCATION_SYNC_MS = 60000
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported on this device"))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Allow location access to go online")),
      { enableHighAccuracy: true, timeout: 15000 }
    )
  })
}

const statusChip = {
  pending: { label: "New request", className: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", bar: "border-l-amber-500" },
  accepted: { label: "In progress", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", bar: "border-l-emerald-500" },
}

const initials = (name) =>
  String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")

export default function ServiceDashboard() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [wallet, setWallet] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [ringing, setRinging] = useState(null)
  const [isOnline, setIsOnline] = useState(user?.isOnline !== false)
  const [togglingOnline, setTogglingOnline] = useState(false)
  const [locationError, setLocationError] = useState("")
  const [pricingFor, setPricingFor] = useState(null)
  const [priceInput, setPriceInput] = useState("")
  const [actionError, setActionError] = useState("")
  const [tab, setTab] = useState("pending")

  useEffect(() => {
    Promise.allSettled([apiFetch("/services/requests/incoming"), apiFetch("/payments/wallet"), apiFetch("/notifications")]).then(
      ([reqRes, walletRes, notifRes]) => {
        if (reqRes.status === "fulfilled") setRequests(reqRes.value.requests || [])
        if (walletRes.status === "fulfilled") setWallet(walletRes.value.wallet)
        if (notifRes.status === "fulfilled") {
          let dismissed = []
          try {
            dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]")
          } catch {
            dismissed = []
          }
          setUnreadCount((notifRes.value.notifications || []).filter((n) => !dismissed.includes(n._id)).length)
        }
        setLoading(false)
      }
    )
  }, [])

  // Scoped to this page so it authenticates with the provider session.
  useEffect(() => {
    const { accessToken } = getSession("provider")
    const socket = io(SOCKET_URL, { auth: { token: accessToken }, transports: ["websocket", "polling"] })
    const onNew = (request) => {
      setRequests((prev) => [request, ...prev.filter((r) => r._id !== request._id)])
      setRinging(request)
    }
    const onUpdate = (updated) => {
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)))
    }
    socket.on("service:new", onNew)
    socket.on("service:update", onUpdate)
    return () => {
      socket.off("service:new", onNew)
      socket.off("service:update", onUpdate)
      socket.disconnect()
    }
  }, [])

  const respond = async (id, action, amount) => {
    setActing(true)
    setActionError("")
    try {
      const body = amount !== undefined ? { action, amount } : { action }
      const data = await apiFetch(`/services/requests/${id}/respond`, { method: "PATCH", body })
      setRequests((prev) => prev.map((r) => (r._id === id ? data.request : r)))
      if (ringing?._id === id) setRinging(null)
      return true
    } catch (err) {
      setActionError(err.message || "Action failed")
      return false
    } finally {
      setActing(false)
    }
  }

  const openPricePrompt = (id) => {
    setPriceInput("")
    setActionError("")
    setPricingFor(id)
  }

  const submitPrice = async () => {
    const amount = Number(priceInput)
    if (!(amount > 0)) {
      setActionError("Enter the price for this service")
      return
    }
    if (await respond(pricingFor, "accept", amount)) setPricingFor(null)
  }

  const saveAvailability = async (nextOnline, coords) => {
    const data = await apiFetch("/providers/me/availability", {
      method: "PATCH",
      body: coords ? { isOnline: nextOnline, coords } : { isOnline: nextOnline },
    })
    const { accessToken, refreshToken } = getSession("provider")
    login({ accessToken, refreshToken, user: { ...user, ...data.provider, role: "provider" } })
  }

  const toggleOnline = async () => {
    const next = !isOnline
    setTogglingOnline(true)
    setLocationError("")
    try {
      if (next) {
        const coords = await getCurrentLocation()
        await saveAvailability(true, coords)
      } else {
        await saveAvailability(false)
      }
      setIsOnline(next)
    } catch (err) {
      setLocationError(err.message || "Could not go online")
    } finally {
      setTogglingOnline(false)
    }
  }

  // While online, keep the saved position fresh.
  useEffect(() => {
    if (!isOnline || !navigator.geolocation) return
    let lastSentAt = 0
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now()
        if (now - lastSentAt < LOCATION_SYNC_MS) return
        lastSentAt = now
        saveAvailability(true, { lat: pos.coords.latitude, lng: pos.coords.longitude }).catch(() => {})
      },
      () => setLocationError("Location access is needed to stay visible to users."),
      { enableHighAccuracy: true, maximumAge: 30000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  const shown = requests.filter((r) => r.status === tab)
  const active = useMemo(() => requests.filter((r) => r.status === "pending" || r.status === "accepted"), [requests])
  const pendingCount = requests.filter((r) => r.status === "pending").length
  const acceptedCount = requests.filter((r) => r.status === "accepted").length
  const completedCount = requests.filter((r) => r.status === "completed").length

  const firstName = (user?.name || "there").split(" ")[0]
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })

  const quickLinks = [
    { label: "Jobs", hint: "Find work", icon: Briefcase, to: "/service/jobs", grad: "from-violet-500 to-indigo-600", shadow: "shadow-indigo-500/30" },
    { label: "Earnings", hint: "Your income", icon: IndianRupee, to: "/service/earnings", grad: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/30" },
    { label: "Reviews", hint: "Client ratings", icon: Star, to: "/service/reviews", grad: "from-amber-400 to-orange-500", shadow: "shadow-orange-500/30" },
    { label: "History", hint: "All bookings", icon: ClipboardList, to: "/service/bookings", grad: "from-rose-500 to-pink-600", shadow: "shadow-rose-500/30" },
  ]

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-6">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => navigate("/service/profile")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B1C33] text-sm font-bold text-[#C28D2E]">
            {initials(user?.name)}
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-bold leading-tight text-neutral-900">Hello, {firstName}</h1>
            <p className="flex items-center gap-1 truncate text-[11px] text-neutral-500">
              {user?.location ? <><MapPin className="h-3 w-3" />{user.location}</> : today}
            </p>
          </div>
        </div>
        <button onClick={() => navigate("/service/notifications")} aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 active:bg-neutral-100">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>
          )}
        </button>
      </header>

      <div className="space-y-4 px-4 pt-4">
        {/* Status + wallet */}
        <section className="overflow-hidden rounded-2xl bg-[#0B1C33] text-white shadow-sm">
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">
                <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-400" : "bg-neutral-400"}`} />
                {isOnline ? "You're online" : "You're offline"}
              </p>
              <p className="mt-1 text-[13px] text-white/80">
                {togglingOnline ? "Updating your location..." : isOnline ? "Clients near you can book you" : "Go online to receive requests"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isOnline}
              aria-label="Availability"
              onClick={toggleOnline}
              disabled={togglingOnline}
              className={`flex h-8 w-14 shrink-0 items-center rounded-full p-[3px] transition-colors disabled:opacity-60 ${isOnline ? "bg-emerald-500" : "bg-white/25"}`}
            >
              <span className={`block h-[26px] w-[26px] rounded-full bg-white shadow transition-transform ${isOnline ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
          <button onClick={() => navigate("/service/wallet")} className="flex w-full items-center justify-between border-t border-white/10 bg-white/5 px-4 py-3 text-left">
            <span>
              <span className="block text-[11px] text-white/60">Wallet balance</span>
              <span className="block text-xl font-extrabold text-[#E3B65A]">{loading ? "—" : fmt(wallet?.balance)}</span>
            </span>
            <span className="flex items-center gap-1 text-[12px] font-semibold text-white/80">View <ChevronRight className="h-4 w-4" /></span>
          </button>
        </section>
        {locationError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{locationError}</p>}

        {/* Summary */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { icon: Clock, label: "New", value: pendingCount, grad: "from-amber-400 to-orange-500" },
            { icon: Wrench, label: "Active", value: acceptedCount, grad: "from-emerald-500 to-teal-600" },
            { icon: CheckCircle2, label: "Completed", value: completedCount, grad: "from-sky-500 to-blue-600" },
          ].map(({ icon: Icon, label, value, grad }) => (
            <div key={label} className={`rounded-2xl bg-gradient-to-br ${grad} p-3 text-white shadow-md`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/25"><Icon className="h-4 w-4" /></span>
              <p className="mt-2 text-xl font-extrabold leading-none">{loading ? "—" : value}</p>
              <p className="mt-1 text-[11px] font-medium text-white/85">{label}</p>
            </div>
          ))}
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-2 gap-3">
          {quickLinks.map(({ label, hint, icon: Icon, to, grad, shadow }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(to)}
              className={`relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-3.5 text-left text-white shadow-lg ${shadow} transition active:scale-[0.97]`}
            >
              <span className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/15" />
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/25"><Icon className="h-5 w-5" /></span>
              <span className="relative min-w-0">
                <span className="block truncate text-[14px] font-bold">{label}</span>
                <span className="block truncate text-[11px] text-white/80">{hint}</span>
              </span>
            </button>
          ))}
        </section>

        {/* Requests */}
        <section>
          <div className="mb-3 flex rounded-xl bg-neutral-200/70 p-1">
            {[
              { key: "pending", label: "New requests", count: pendingCount },
              { key: "accepted", label: "Active jobs", count: acceptedCount },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-semibold transition ${tab === t.key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}
              >
                {t.label}
                <span className={`rounded-full px-1.5 text-[10px] font-bold ${tab === t.key ? "bg-[#0B1C33] text-white" : "bg-neutral-300 text-neutral-600"}`}>{t.count}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-14">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#C28D2E] border-t-transparent" />
            </div>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100"><Stethoscope className="h-6 w-6 text-neutral-400" /></span>
              <p className="text-sm font-bold text-neutral-800">{tab === "pending" ? "No new requests" : "No active jobs"}</p>
              <p className="text-[12px] text-neutral-500">{tab === "pending" ? "New requests from clients will appear here." : "Accepted jobs will appear here."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map((req) => {
                const chip = statusChip[req.status]
                return (
                  <div key={req._id} className={`rounded-2xl border border-neutral-200 border-l-4 bg-white p-4 ${chip.bar}`}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-neutral-700">
                        {initials(req.user?.name || req.user?.phone)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-neutral-900">{req.user?.name || req.user?.phone}</p>
                        <p className="truncate text-[12px] capitalize text-neutral-500">{req.serviceType}</p>
                      </div>
                      <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${chip.className}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} />
                        {chip.label}
                      </span>
                    </div>

                    {req.message && <p className="mt-3 line-clamp-2 rounded-xl bg-neutral-50 p-3 text-[12px] leading-relaxed text-neutral-600">{req.message}</p>}

                    {req.user?.phone && (
                      <a href={`tel:${req.user.phone}`} className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0B1C33]">
                        <Phone className="h-3.5 w-3.5" /> {req.user.phone}
                      </a>
                    )}

                    {req.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => respond(req._id, "reject")} disabled={acting} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-300 py-2.5 text-[13px] font-semibold text-neutral-700 transition active:scale-[0.98] disabled:opacity-50">
                          <XCircle className="h-4 w-4" /> Decline
                        </button>
                        <button onClick={() => openPricePrompt(req._id)} disabled={acting} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B1C33] py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50">
                          <CheckCircle2 className="h-4 w-4" /> Accept
                        </button>
                      </div>
                    )}
                    {req.status === "accepted" && (
                      <button onClick={() => respond(req._id, "complete")} disabled={acting} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50">
                        <CheckCircle2 className="h-4 w-4" /> Mark as completed
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* New request: a sheet that slides up, instead of a full-screen takeover */}
      {ringing && !pricingFor && (
        <div className="ashwa-fade-in fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-[2px] sm:items-center">
          <div className="ashwa-sheet-up w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B1C33] text-base font-extrabold text-[#C28D2E]">
                {initials(ringing.user?.name || ringing.user?.phone)}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#C28D2E]">New service request</p>
                <p className="truncate text-lg font-extrabold text-[#0A0A0A]">{ringing.user?.name || ringing.user?.phone}</p>
                <p className="text-[12px] capitalize text-neutral-500">{ringing.serviceType}</p>
              </div>
            </div>
            {ringing.message && <p className="mt-3 line-clamp-3 rounded-2xl bg-neutral-50 p-3 text-[12px] text-neutral-600">{ringing.message}</p>}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => respond(ringing._id, "reject")}
                disabled={acting}
                className="flex-1 rounded-2xl bg-neutral-100 py-3.5 text-sm font-bold text-neutral-700 transition active:scale-[0.97] disabled:opacity-50"
              >
                Decline
              </button>
              <button
                onClick={() => openPricePrompt(ringing._id)}
                disabled={acting}
                className="flex-1 rounded-2xl bg-[#0B1C33] py-3.5 text-sm font-bold text-white shadow-md shadow-[#0B1C33]/30 transition active:scale-[0.97] disabled:opacity-50"
              >
                Accept
              </button>
            </div>
            <button onClick={() => setRinging(null)} className="mt-3 flex w-full items-center justify-center gap-1 text-[12px] font-semibold text-neutral-400">
              Decide later <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {pricingFor && (
        <div className="ashwa-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-[2px] sm:items-center">
          <div className="ashwa-sheet-up w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-extrabold text-[#0A0A0A]">Set your price</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
              This is what the client pays. Ashwa India keeps a small commission, and the rest goes to your wallet once you mark the job completed.
            </p>
            <div className="relative mt-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-neutral-400">₹</span>
              <input
                inputMode="numeric"
                autoFocus
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="1500"
                className="h-14 w-full rounded-2xl border-2 border-neutral-200 pl-9 pr-4 text-2xl font-extrabold text-[#0A0A0A] outline-none transition focus:border-[#C28D2E]"
              />
            </div>
            {actionError && <p className="mt-2 text-xs font-medium text-rose-600">{actionError}</p>}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setPricingFor(null)}
                className="flex-1 rounded-2xl bg-neutral-100 py-3.5 text-sm font-bold text-neutral-700 transition active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                onClick={submitPrice}
                disabled={acting}
                className="flex-1 rounded-2xl bg-[#0B1C33] py-3.5 text-sm font-bold text-white shadow-md shadow-[#0B1C33]/30 transition active:scale-[0.97] disabled:opacity-50"
              >
                {acting ? "Accepting..." : "Accept & send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
