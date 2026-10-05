import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import { Activity, Bell, Briefcase, CheckCircle2, Clock, Layers, MapPin, Phone, Stethoscope, Wallet as WalletIcon, XCircle } from "lucide-react"
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
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700", bar: "bg-amber-400" },
  accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
}

function StatCard({ icon: Icon, label, value, gradient, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`relative overflow-hidden rounded-2xl p-4 text-left shadow-sm ${gradient} disabled:cursor-default`}
    >
      <span className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/10" />
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
        <Icon className="h-[18px] w-[18px] text-white" />
      </span>
      <p className="mt-3 truncate text-2xl font-extrabold text-white">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/75">{label}</p>
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

  return (
    <div className="min-h-screen pb-4">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div>
          <p className="text-xs text-neutral-500">{today}</p>
          <h1 className="text-xl font-extrabold text-[#0F2238]">Hi, {firstName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/service/notifications")} className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
            <Bell className="h-[17px] w-[17px] text-[#0F2238]" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-white bg-red-500 px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className={`mx-4 mt-2 flex items-center justify-between rounded-2xl px-4 py-3.5 shadow-sm transition-colors ${isOnline ? "bg-emerald-600" : "bg-[#0B1C33]"}`}>
        <div>
          <p className="text-sm font-extrabold text-white">{isOnline ? "You're Online" : "You're Offline"}</p>
          <p className="text-[11px] text-white/75">
            {togglingOnline ? "Updating your location..." : isOnline ? "Receiving requests near you" : "Turn on to receive requests"}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={isOnline}
          aria-label="Online status"
          onClick={toggleOnline}
          disabled={togglingOnline}
          className={`flex h-7 w-12 shrink-0 items-center rounded-full p-[3px] transition-colors disabled:opacity-60 ${
            isOnline ? "justify-end bg-white/40" : "justify-start bg-white/20"
          }`}
        >
          <span className="block h-[22px] w-[22px] rounded-full bg-white shadow" />
        </button>
      </div>

      {locationError && <p className="mx-4 mt-2 text-xs text-destructive">{locationError}</p>}

      <div className="mx-4 mt-3 flex items-center gap-4 rounded-2xl bg-[#0B1C33] p-4 shadow-[0_6px_12px_rgba(11,28,51,0.2)]">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#C28D2E]">
          <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#132B4A]">
            <Stethoscope className="h-[26px] w-[26px] text-[#C28D2E]" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-white">{user?.businessName || user?.name || "Service Provider"}</p>
          <p className="mt-0.5 text-[12px] text-[#A9B8CC]">{user?.phone}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(user?.serviceTypes || []).slice(0, 3).map((s) => (
              <span key={s} className="rounded-full bg-[#132B4A] px-2 py-0.5 text-[10px] font-bold capitalize text-[#C28D2E]">
                {s}
              </span>
            ))}
            {user?.location && (
              <span className="flex items-center gap-1 rounded-full bg-[#132B4A] px-2 py-0.5 text-[10px] font-bold text-[#A9B8CC]">
                <MapPin className="h-2.5 w-2.5" />
                {user.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <StatCard icon={Clock} label="Pending requests" value={loading ? "—" : pendingCount} gradient="bg-gradient-to-br from-amber-400 to-amber-600" />
        <StatCard icon={Activity} label="Active jobs" value={loading ? "—" : acceptedCount} gradient="bg-gradient-to-br from-emerald-500 to-emerald-700" />
        <StatCard
          icon={WalletIcon}
          label="Wallet balance"
          value={loading ? "—" : fmt(wallet?.balance)}
          gradient="bg-gradient-to-br from-[#C28D2E] to-[#8A6416]"
          onClick={() => navigate("/service/wallet")}
        />
        <StatCard
          icon={Layers}
          label="Completed"
          value={loading ? "—" : completedCount}
          gradient="bg-gradient-to-br from-[#132B4A] to-[#0B1C33]"
          onClick={() => navigate("/service/bookings")}
        />
      </div>

      <button
        onClick={() => navigate("/service/jobs")}
        className="mx-4 mt-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-4 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8E6F9]">
          <Briefcase className="h-5 w-5 text-[#4B3FA6]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-[#0F2238]">Horse Jobs</span>
          <span className="block text-[12px] text-neutral-500">Browse trainer, groom, rider and vet roles and apply</span>
        </span>
        <span className="text-xs font-bold text-[#C28D2E]">Open →</span>
      </button>

      <div className="mt-6 flex items-center justify-between px-4">
        <h2 className="text-[15px] font-extrabold text-[#0F2238]">Active Bookings</h2>
        <span className="rounded-full bg-[#F6E9C9] px-2.5 py-0.5 text-[11px] font-bold text-[#8A6416]">{active.length}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : active.length === 0 ? (
        <div className="mx-4 mt-3 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#D8D3C5] bg-white px-6 py-10 text-center">
          <Stethoscope className="h-8 w-8 text-neutral-400" />
          <p className="text-sm font-semibold text-[#0F2238]">No active bookings</p>
          <p className="text-[12px] text-neutral-500">New service requests from users will appear here and ring you in real time.</p>
        </div>
      ) : (
        <div className="mt-3 space-y-3 px-4">
          {active.map((req) => {
            const chip = statusChip[req.status]
            return (
              <div key={req._id} className="relative overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white p-4 pl-5 shadow-sm">
                <span className={`absolute inset-y-0 left-0 w-1 ${chip.bar}`} />
                <div className="flex items-center justify-between gap-2">
                  <p className="flex-1 truncate text-sm font-bold text-[#0F2238]">{req.user?.name || req.user?.phone}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${chip.className}`}>{chip.label}</span>
                </div>
                <p className="mt-1.5 text-[12px] font-semibold capitalize text-neutral-600">{req.serviceType}</p>
                {req.message && <p className="mt-1 line-clamp-2 text-[12px] text-neutral-500">{req.message}</p>}
                {req.user?.phone && (
                  <a href={`tel:${req.user.phone}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#C28D2E]">
                    <Phone className="h-3 w-3" /> Call user
                  </a>
                )}

                {req.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => respond(req._id, "reject")}
                      disabled={acting}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#F1EEE6] py-2.5 text-[13px] font-bold text-[#0F2238] disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" /> Decline
                    </button>
                    <button
                      onClick={() => openPricePrompt(req._id)}
                      disabled={acting}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#C28D2E] py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Accept
                    </button>
                  </div>
                )}
                {req.status === "accepted" && (
                  <button
                    onClick={() => respond(req._id, "complete")}
                    disabled={acting}
                    className="mt-3 w-full rounded-xl bg-[#0B1C33] py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
                  >
                    Mark as completed
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {ringing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1C33]/90 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#C28D2E]">
              <Phone className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-base font-bold text-[#0F2238]">New Service Request</h2>
            <p className="mt-2 text-xl font-extrabold text-[#0F2238]">{ringing.user?.name || ringing.user?.phone}</p>
            <p className="mt-1 text-[13px] capitalize text-neutral-500">{ringing.serviceType}</p>
            <div className="mt-8 flex justify-center gap-6">
              <button
                onClick={() => respond(ringing._id, "reject")}
                disabled={acting}
                className="flex h-[88px] w-[88px] flex-col items-center justify-center gap-1.5 rounded-full bg-[#ef4444] text-white disabled:opacity-60"
              >
                <XCircle className="h-[22px] w-[22px]" />
                <span className="text-xs font-bold">Decline</span>
              </button>
              <button
                onClick={() => openPricePrompt(ringing._id)}
                disabled={acting}
                className="flex h-[88px] w-[88px] flex-col items-center justify-center gap-1.5 rounded-full bg-[#16a34a] text-white disabled:opacity-60"
              >
                <CheckCircle2 className="h-[22px] w-[22px]" />
                <span className="text-xs font-bold">Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {pricingFor && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0B1C33]/70 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6">
            <h2 className="text-base font-bold text-[#0F2238]">Price for this service</h2>
            <p className="mt-1 text-[12px] text-neutral-500">
              Set the amount you will charge. Ashwa India keeps its commission from this, and the rest goes to your wallet when you mark the job completed.
            </p>
            <div className="relative mt-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500">₹</span>
              <input
                inputMode="numeric"
                autoFocus
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="e.g. 1500"
                className="h-12 w-full rounded-xl border border-[#E4E1D8] pl-8 pr-4 text-lg font-bold text-[#0F2238] outline-none focus:border-[#C28D2E]"
              />
            </div>
            {actionError && <p className="mt-2 text-xs text-destructive">{actionError}</p>}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setPricingFor(null)}
                className="flex-1 rounded-xl bg-[#F1EEE6] py-3 text-sm font-bold text-[#0F2238]"
              >
                Cancel
              </button>
              <button
                onClick={submitPrice}
                disabled={acting}
                className="flex-1 rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {acting ? "Accepting..." : "Accept & set price"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
