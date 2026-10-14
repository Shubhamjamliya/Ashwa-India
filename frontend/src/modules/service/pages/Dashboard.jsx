import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import { ArrowRight, BarChart3, Bell, Briefcase, CheckCircle2, ChevronRight, ClipboardList, Clock, Eye, EyeOff, Headphones, IndianRupee, MapPin, Phone, Plus, RefreshCw, Star, Wallet as WalletIcon, XCircle } from "lucide-react"
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
    // Another nearby provider accepted this booking first.
    const onTaken = ({ _id }) => {
      setRequests((prev) => prev.filter((r) => r._id !== _id || r.provider))
      setRinging((cur) => (cur?._id === _id ? null : cur))
    }
    socket.on("service:update", onUpdate)
    socket.on("service:taken", onTaken)
    return () => {
      socket.off("service:new", onNew)
      socket.off("service:update", onUpdate)
      socket.off("service:taken", onTaken)
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
      if (err.message?.includes("already been taken")) {
        setRequests((prev) => prev.filter((r) => r._id !== id))
        setPricingFor(null)
        setRinging(null)
      }
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
  const completedCount = requests.filter((r) => r.status === "completed").length

  const firstName = (user?.name || "there").split(" ")[0]
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })

  const rating = Number(user?.rating?.average ?? user?.rating ?? 0) || 0
  const [showBalance, setShowBalance] = useState(true)

  const quickRow = [
    { label: "Add Money", icon: WalletIcon, to: "/service/wallet", tint: "bg-emerald-50 text-emerald-600" },
    { label: "Post Job", icon: Briefcase, to: "/service/jobs/new", tint: "bg-sky-50 text-sky-600" },
    { label: "Alerts", icon: Bell, to: "/service/notifications", tint: "bg-fuchsia-50 text-fuchsia-600" },
    { label: "Transactions", icon: ClipboardList, to: "/service/wallet", tint: "bg-orange-50 text-orange-500" },
  ]

  const services = [
    { label: "Jobs", hint: "Find work & earn", icon: Briefcase, to: "/service/jobs", card: "from-violet-50 to-indigo-100/70", icon_: "from-violet-500 to-indigo-600", chev: "bg-indigo-100 text-indigo-600" },
    { label: "Earnings", hint: "Your income", icon: IndianRupee, to: "/service/earnings", card: "from-emerald-50 to-green-100/70", icon_: "from-emerald-500 to-green-600", chev: "bg-emerald-100 text-emerald-600" },
    { label: "Reviews", hint: "Client ratings", icon: Star, to: "/service/reviews", card: "from-amber-50 to-orange-100/70", icon_: "from-amber-400 to-orange-500", chev: "bg-orange-100 text-orange-500" },
    { label: "History", hint: "All bookings", icon: Clock, to: "/service/bookings", card: "from-rose-50 to-pink-100/70", icon_: "from-rose-500 to-pink-600", chev: "bg-rose-100 text-rose-500" },
    { label: "Reports", hint: "Insights & stats", icon: BarChart3, to: "/service/earnings", card: "from-sky-50 to-blue-100/70", icon_: "from-sky-500 to-blue-600", chev: "bg-sky-100 text-sky-600" },
    { label: "Support", hint: "Get help", icon: Headphones, to: "/service/help", card: "from-indigo-50 to-purple-100/70", icon_: "from-indigo-600 to-purple-700", chev: "bg-purple-100 text-purple-600" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF3FF] via-[#F6F8FD] to-[#F6F8FD] pb-6">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pb-2 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => navigate("/service/profile")} className="relative shrink-0">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0B1C33] text-xl font-extrabold text-[#F2B93B]">{initials(user?.name)}</span>
            <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${isOnline ? "bg-emerald-500" : "bg-neutral-400"}`} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-extrabold leading-tight text-[#0B1C33]">Hello, {firstName}</h1>
            <p className="flex items-center gap-1 truncate text-[13px] text-indigo-500">
              <MapPin className="h-3.5 w-3.5" />
              {user?.location || today}
            </p>
          </div>
        </div>
        <button onClick={() => navigate("/service/notifications")} aria-label="Notifications" className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#0B1C33] shadow-[0_4px_16px_rgba(30,50,120,0.12)] active:scale-95">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />}
        </button>
      </header>

      <div className="space-y-5 px-4 pt-3">
        {/* Availability */}
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-[0_4px_16px_rgba(30,50,120,0.08)]">
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#0B1C33]">{isOnline ? "Available for bookings" : "Not available"}</p>
            <p className="text-[11px] text-neutral-500">{togglingOnline ? "Updating your location..." : isOnline ? "Clients near you can book you" : "Switch on to receive requests"}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isOnline}
            aria-label="Availability"
            onClick={toggleOnline}
            disabled={togglingOnline}
            className={`flex h-8 w-14 shrink-0 items-center rounded-full p-[3px] transition-colors disabled:opacity-60 ${isOnline ? "bg-emerald-500" : "bg-neutral-300"}`}
          >
            <span className={`block h-[26px] w-[26px] rounded-full bg-white shadow transition-transform ${isOnline ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
        {locationError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{locationError}</p>}

        {/* Wallet card */}
        <section className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#0A1530] via-[#10244F] to-[#1B3A7A] px-4 py-3 text-white shadow-[0_8px_20px_rgba(16,36,79,0.3)]">
          <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-500/20" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                Wallet balance
                <button onClick={() => setShowBalance((v) => !v)} aria-label="Toggle balance" className="text-white/70">
                  {showBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </p>
              <p className="mt-0.5 text-[28px] font-extrabold leading-tight">{loading ? "—" : showBalance ? fmt(wallet?.balance) : "₹ ••••"}</p>
            </div>
            <button onClick={() => navigate("/service/wallet")} className="flex shrink-0 items-center gap-1.5 rounded-md bg-white/15 px-3.5 py-2 text-[13px] font-bold backdrop-blur active:scale-95">
              View Wallet <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Quick row */}
        <section className="grid grid-cols-4 divide-x divide-neutral-100 rounded-[24px] bg-white py-4 shadow-[0_4px_20px_rgba(30,50,120,0.08)]">
          {quickRow.map(({ label, icon: Icon, to, tint }) => (
            <button key={label} type="button" onClick={() => navigate(to)} className="flex flex-col items-center gap-2 px-1 active:scale-95">
              <span className={`flex h-14 w-14 items-center justify-center rounded-full ${tint}`}><Icon className="h-6 w-6" /></span>
              <span className="text-[12px] font-semibold text-[#0B1C33]">{label}</span>
            </button>
          ))}
        </section>

        {/* Services */}
        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[20px] font-extrabold text-[#0B1C33]">Our Services</h2>
            <button onClick={() => navigate("/service/jobs")} className="flex items-center gap-1 text-[13px] font-semibold text-blue-600">View All <ArrowRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {services.map(({ label, hint, icon: Icon, to, card, icon_, chev }) => (
              <button key={label} type="button" onClick={() => navigate(to)} className={`flex items-center gap-2.5 rounded-2xl bg-gradient-to-br ${card} p-3 text-left shadow-[0_3px_12px_rgba(30,50,120,0.07)] ring-1 ring-white transition active:scale-[0.97]`}>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${icon_} text-white shadow-md`}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-[#0B1C33]">{label}</span>
                  <span className="block truncate text-[11px] text-neutral-500">{hint}</span>
                </span>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${chev}`}><ChevronRight className="h-4 w-4" /></span>
              </button>
            ))}
          </div>
        </section>

        {/* Performance */}
        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0A1530] to-[#14295A] p-5 text-white shadow-[0_10px_26px_rgba(16,36,79,0.3)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[18px] font-extrabold">Your Performance</h2>
              <p className="text-[12px] text-white/60">Track your growth</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><BarChart3 className="h-5 w-5" /></span>
          </div>
          <div className="mt-4 grid grid-cols-3 divide-x divide-white/10">
            <div className="pr-3">
              <p className="text-[11px] text-white/70">Total Bookings</p>
              <p className="mt-1 text-2xl font-extrabold">{loading ? "—" : requests.length}</p>
            </div>
            <div className="px-3">
              <p className="text-[11px] text-white/70">Completed Jobs</p>
              <p className="mt-1 text-2xl font-extrabold">{loading ? "—" : completedCount}</p>
            </div>
            <div className="pl-3">
              <p className="text-[11px] text-white/70">Rating</p>
              <p className="mt-1 flex items-center gap-1.5 text-2xl font-extrabold">{rating.toFixed(1)} <Star className="h-4 w-4 fill-amber-400 text-amber-400" /></p>
            </div>
          </div>
        </section>

        {/* Requests */}
        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[20px] font-extrabold text-[#0B1C33]">Your Requests</h2>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[12px] font-bold text-indigo-600">{active.length}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-14">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
            </div>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-[24px] bg-white px-6 py-9 text-center shadow-[0_4px_20px_rgba(30,50,120,0.08)]">
              <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400">
                <ClipboardList className="h-8 w-8" />
                <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white"><Plus className="h-4 w-4" /></span>
              </span>
              <p className="mt-2 text-[17px] font-extrabold text-[#0B1C33]">No new requests</p>
              <p className="text-[12px] text-neutral-500">New requests from clients will appear here.</p>
              <button onClick={() => window.location.reload()} className="mt-3 flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-500/30 active:scale-95">
                <RefreshCw className="h-4 w-4" /> Pull to refresh
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((req) => {
                const chip = statusChip[req.status]
                return (
                  <div key={req._id} className={`rounded-2xl border-l-4 bg-white p-4 shadow-[0_4px_16px_rgba(30,50,120,0.08)] ${chip.bar}`}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                        {initials(req.user?.name || req.user?.phone)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#0B1C33]">{req.user?.name || req.user?.phone}</p>
                        <p className="truncate text-[12px] capitalize text-neutral-500">{req.serviceType}</p>
                      </div>
                      <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${chip.className}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} />
                        {chip.label}
                      </span>
                    </div>

                    {req.address && <p className="mt-3 flex items-start gap-1.5 text-[12px] text-neutral-600"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />{req.address}</p>}

                    {req.message && <p className="mt-3 line-clamp-2 rounded-xl bg-neutral-50 p-3 text-[12px] leading-relaxed text-neutral-600">{req.message}</p>}

                    {req.user?.phone && (
                      <a href={`tel:${req.user.phone}`} className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-indigo-600">
                        <Phone className="h-3.5 w-3.5" /> {req.user.phone}
                      </a>
                    )}

                    {req.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => respond(req._id, "reject")} disabled={acting} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-300 py-2.5 text-[13px] font-semibold text-neutral-700 transition active:scale-[0.98] disabled:opacity-50">
                          <XCircle className="h-4 w-4" /> Decline
                        </button>
                        <button onClick={() => openPricePrompt(req._id)} disabled={acting} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-indigo-500/30 transition active:scale-[0.98] disabled:opacity-50">
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
