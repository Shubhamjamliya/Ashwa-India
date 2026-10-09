import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import { Bell, Briefcase, CheckCircle2, ChevronRight, ClipboardList, Clock, MapPin, Phone, Sparkles, Star, Stethoscope, Wallet as WalletIcon, Wrench, XCircle } from "lucide-react"
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
  pending: { label: "New", className: "bg-[#FBF6EC] text-[#8A6416] ring-[#EBD39A]", dot: "bg-[#C28D2E]" },
  accepted: { label: "In progress", className: "bg-[#0B1C33] text-white ring-[#0B1C33]", dot: "bg-[#C28D2E]" },
}

const initials = (name) =>
  String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")

// One tappable number: a soft pastel tile in the scrolling row.
function StatTile({ icon: Icon, label, value, tint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex w-[132px] shrink-0 snap-start flex-col rounded-3xl p-4 text-left transition active:scale-[0.97] disabled:cursor-default ${tint.bg}`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tint.icon}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className={`mt-4 truncate text-[22px] font-extrabold leading-none ${tint.text}`}>{value}</span>
      <span className="mt-1.5 text-[11px] font-semibold text-neutral-500">{label}</span>
    </button>
  )
}

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

  const active = useMemo(() => requests.filter((r) => r.status === "pending" || r.status === "accepted"), [requests])
  const pendingCount = requests.filter((r) => r.status === "pending").length
  const acceptedCount = requests.filter((r) => r.status === "accepted").length
  const completedCount = requests.filter((r) => r.status === "completed").length

  const firstName = (user?.name || "there").split(" ")[0]
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })

  const quickLinks = [
    { label: "Horse jobs", hint: "Browse and apply", icon: Briefcase, to: "/service/jobs", bg: "bg-white ring-1 ring-[#E4E1D8]", iconBg: "bg-[#0B1C33] text-[#C28D2E]" },
    { label: "Earnings", hint: "See your income", icon: Sparkles, to: "/service/earnings", bg: "bg-white ring-1 ring-[#E4E1D8]", iconBg: "bg-[#0B1C33] text-[#C28D2E]" },
    { label: "Reviews", hint: "What clients say", icon: Star, to: "/service/reviews", bg: "bg-white ring-1 ring-[#E4E1D8]", iconBg: "bg-[#0B1C33] text-[#C28D2E]" },
    { label: "Bookings", hint: "Full history", icon: ClipboardList, to: "/service/bookings", bg: "bg-white ring-1 ring-[#E4E1D8]", iconBg: "bg-[#0B1C33] text-[#C28D2E]" },
  ]

  return (
    <div className="min-h-screen bg-[#FAF7F1] pb-6">
      {/* Greeting */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#050B14] via-[#0B1C33] to-[#132B4A] px-5 pb-16 pt-5 text-white">
        <span className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#C28D2E]/15" />
        <span className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-base font-extrabold ring-2 ring-[#C28D2E]">
              {initials(user?.name)}
            </span>
            <div className="min-w-0">
              <p className="text-[12px] text-white/75">{today}</p>
              <h1 className="truncate text-xl font-extrabold leading-tight">Hello, {firstName}</h1>
            </div>
          </div>
          <button
            onClick={() => navigate("/service/notifications")}
            aria-label="Notifications"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur transition active:scale-95"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[#0B1C33] bg-[#C28D2E] px-1 text-[9px] font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-1.5">
          {(user?.serviceTypes || []).slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold capitalize backdrop-blur">
              {t}
            </span>
          ))}
          {user?.location && (
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
              <MapPin className="h-3 w-3" /> {user.location}
            </span>
          )}
        </div>
      </div>

      {/* Availability: floats over the hero */}
      <div className="relative -mt-9 px-4">
        <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(11,28,51,0.25)]">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors ${isOnline ? "bg-[#0B1C33] text-[#C28D2E]" : "bg-rose-50 text-rose-500"}`}>
            <Stethoscope className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold text-[#0A0A0A]">{isOnline ? "Available for bookings" : "Not available"}</p>
            <p className="text-[12px] text-neutral-500">
              {togglingOnline ? "Updating your location..." : isOnline ? "Clients near you can book you" : "Switch on to receive requests"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isOnline}
            aria-label="Availability"
            onClick={toggleOnline}
            disabled={togglingOnline}
            className={`flex h-8 w-14 shrink-0 items-center rounded-full p-[3px] transition-colors duration-300 disabled:opacity-60 ${isOnline ? "bg-[#C28D2E]" : "bg-neutral-400"}`}
          >
            <span className={`block h-[26px] w-[26px] rounded-full bg-white shadow transition-transform duration-300 ${isOnline ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
        {locationError && <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{locationError}</p>}
      </div>

      {/* Numbers */}
      <div className="mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <StatTile icon={Clock} label="New requests" value={loading ? "—" : pendingCount} tint={{ bg: "bg-white ring-1 ring-[#E4E1D8]", icon: "bg-[#0B1C33] text-[#C28D2E]", text: "text-[#0B1C33]" }} />
        <StatTile icon={Wrench} label="Active jobs" value={loading ? "—" : acceptedCount} tint={{ bg: "bg-white ring-1 ring-[#E4E1D8]", icon: "bg-[#0B1C33] text-[#C28D2E]", text: "text-[#0B1C33]" }} />
        <StatTile icon={CheckCircle2} label="Completed" value={loading ? "—" : completedCount} tint={{ bg: "bg-white ring-1 ring-[#E4E1D8]", icon: "bg-[#0B1C33] text-[#C28D2E]", text: "text-[#0B1C33]" }} onClick={() => navigate("/service/bookings")} />
        <StatTile icon={WalletIcon} label="Wallet" value={loading ? "—" : fmt(wallet?.balance)} tint={{ bg: "bg-white ring-1 ring-[#E4E1D8]", icon: "bg-[#0B1C33] text-[#C28D2E]", text: "text-[#0B1C33]" }} onClick={() => navigate("/service/wallet")} />
      </div>

      {/* Quick links */}
      <div className="mt-5 grid grid-cols-2 gap-3 px-4">
        {quickLinks.map(({ label, hint, icon: Icon, to, bg, iconBg }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(to)}
            className={`flex items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.97] ${bg}`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold text-[#0A0A0A]">{label}</span>
              <span className="block truncate text-[11px] text-neutral-500">{hint}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Requests */}
      <div className="mt-7 flex items-center justify-between px-5">
        <h2 className="text-base font-extrabold text-[#0A0A0A]">Your bookings</h2>
        <span className="rounded-full bg-[#0B1C33] px-2.5 py-0.5 text-[11px] font-bold text-[#C28D2E]">{active.length}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#C28D2E] border-t-transparent" />
        </div>
      ) : active.length === 0 ? (
        <div className="ashwa-rise mx-4 mt-3 flex flex-col items-center gap-2 rounded-3xl bg-white px-6 py-10 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0B1C33]">
            <Stethoscope className="h-7 w-7 text-[#C28D2E]" />
          </span>
          <p className="text-sm font-bold text-[#0A0A0A]">No bookings right now</p>
          <p className="text-[12px] text-neutral-500">New service requests from clients will show up here.</p>
        </div>
      ) : (
        <div className="mt-3 space-y-3 px-4">
          {active.map((req, idx) => {
            const chip = statusChip[req.status]
            return (
              <div
                key={req._id}
                style={{ animationDelay: `${Math.min(idx, 6) * 50}ms` }}
                className="ashwa-rise rounded-3xl bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0B1C33] text-sm font-extrabold text-[#C28D2E]">
                    {initials(req.user?.name || req.user?.phone)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0A0A0A]">{req.user?.name || req.user?.phone}</p>
                    <p className="truncate text-[12px] font-medium capitalize text-neutral-500">{req.serviceType}</p>
                  </div>
                  <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${chip.className}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} />
                    {chip.label}
                  </span>
                </div>

                {req.message && <p className="mt-3 line-clamp-2 rounded-2xl bg-neutral-50 p-3 text-[12px] leading-relaxed text-neutral-600">{req.message}</p>}

                {req.user?.phone && (
                  <a href={`tel:${req.user.phone}`} className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#C28D2E]">
                    <Phone className="h-3.5 w-3.5" /> Call {req.user.name?.split(" ")[0] || "client"}
                  </a>
                )}

                {req.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => respond(req._id, "reject")}
                      disabled={acting}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-neutral-100 py-3 text-[13px] font-bold text-neutral-700 transition active:scale-[0.97] disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" /> Decline
                    </button>
                    <button
                      onClick={() => openPricePrompt(req._id)}
                      disabled={acting}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#0B1C33] py-3 text-[13px] font-bold text-white shadow-md shadow-[#0B1C33]/30 transition active:scale-[0.97] disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Accept
                    </button>
                  </div>
                )}
                {req.status === "accepted" && (
                  <button
                    onClick={() => respond(req._id, "complete")}
                    disabled={acting}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#C28D2E] py-3 text-[13px] font-bold text-white shadow-md shadow-[#8A6416]/30 transition active:scale-[0.97] disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark as completed
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

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
