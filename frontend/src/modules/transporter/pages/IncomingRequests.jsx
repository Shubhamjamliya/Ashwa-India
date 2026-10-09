import { useEffect, useMemo, useState } from "react"

import { useNavigate } from "react-router-dom"
import { io } from "socket.io-client"
import { Bell, CheckCircle2, Clock, MapPin, Phone, Truck, Users, Wallet as WalletIcon, XCircle, Activity, Layers } from "lucide-react"
import { apiFetch, getSession } from "@/shared/lib/api"
import { useAuth } from "@/shared/context/AuthContext"
import { getMediaUrl } from "@/shared/lib/media"
import BookingCard from "../components/BookingCard"
import { countByGroup, groupOf, sortForGroup, toTrips } from "../lib/bookingStatus"

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")
const DISMISSED_KEY = "ashwa_transporter_notifications_dismissed"
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const LOCATION_SYNC_MS = 60000

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


const dateLabel = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : null)

function RouteLines({ source, destination }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-1">
        <span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-500 bg-white" />
        <span className="my-0.5 w-px flex-1 bg-[#E4E1D8]" />
        <MapPin className="h-3 w-3 text-rose-500" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-[12px] text-neutral-600">{source.address}</p>
        <p className="text-[12px] text-neutral-600">{destination.address}</p>
      </div>
    </div>
  )
}

// A new booking request, shown in full so the transporter can decide from the card itself.
function EnquiryCard({ req, onRespond, busy }) {
  const [error, setError] = useState("")
  const shared = Boolean(req.hostRequest)
  const open = !req.transporter
  const advance = req.advance?.status === "paid" ? req.advance.amount : 0
  const fare = req.quote?.amount || 0

  const respond = async (action) => {
    setError("")
    try {
      await onRespond(req._id, action)
    } catch (err) {
      setError(err.message || "Could not update the request")
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-[#F1EEE6] bg-[#FBF6EC] px-4 py-2.5">
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${shared ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
          {shared ? <Users className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
          {shared ? "Shared ride request" : "Private transport"}
        </span>
        {open && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">First to accept gets it</span>}
        <span className="text-[10px] font-semibold text-neutral-500">
          {new Date(req.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-[#0F2238]">{req.user?.name || req.user?.phone || "Customer"}</p>
          {req.user?.phone && (
            <a href={`tel:${req.user.phone}`} className="flex items-center gap-1 text-[11px] font-bold text-[#C28D2E]">
              <Phone className="h-3 w-3" /> Call
            </a>
          )}
        </div>

        {req.vehicleTypeInfo && (
          <div className="flex items-center gap-2 rounded-lg bg-[#F1EEE6] px-2.5 py-1.5">
            <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-white">
              {req.vehicleTypeInfo.icon ? (
                <img src={getMediaUrl(req.vehicleTypeInfo.icon)} alt="" className="h-full w-full object-contain p-0.5" />
              ) : (
                <Truck className="h-4 w-4 text-[#C28D2E]" />
              )}
            </span>
            <p className="text-[12px] font-bold text-[#0F2238]">{req.vehicleTypeInfo.name}</p>
          </div>
        )}

        <RouteLines source={req.source} destination={req.destination} />

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-[#F1EEE6] px-2 py-1.5">
            <p className="text-[10px] font-semibold text-neutral-500">Travel date</p>
            <p className="text-[12px] font-bold text-[#0F2238]">{dateLabel(req.scheduledDate) || "Flexible"}</p>
          </div>
          <div className="rounded-lg bg-[#F1EEE6] px-2 py-1.5">
            <p className="text-[10px] font-semibold text-neutral-500">Animals</p>
            <p className="text-[12px] font-bold text-[#0F2238]">{req.animals || 1}</p>
          </div>
          <div className="rounded-lg bg-[#F1EEE6] px-2 py-1.5">
            <p className="text-[10px] font-semibold text-neutral-500">Distance</p>
            <p className="text-[12px] font-bold text-[#0F2238]">{req.quote?.tripKm ?? "—"} km</p>
          </div>
        </div>

        {shared && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-2.5 text-[11px] text-blue-900">
            <p className="font-bold">Joins your accepted booking on {dateLabel(req.hostRequest.scheduledDate)}</p>
            <p className="mt-0.5 text-blue-800">
              {req.hostRequest.source?.address} → {req.hostRequest.destination?.address} · {req.hostRequest.animals || 1} animal(s) already booked
            </p>
            <p className="mt-0.5 text-blue-800">The first customer agreed to share. Accepting splits the fare between both customers.</p>
          </div>
        )}

        <div className="space-y-1 rounded-lg border border-[#E4E1D8] p-2.5 text-[12px]">
          <div className="flex justify-between">
            <span className="text-neutral-500">{shared ? "Customer's share" : "Fare"}</span>
            <span className="font-extrabold text-[#0F2238]">{fmt(fare)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Advance paid</span>
            <span className="font-bold text-emerald-700">{fmt(advance)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Due at delivery</span>
            <span className="font-bold text-[#0F2238]">{fmt(Math.max(0, fare - advance))}</span>
          </div>
        </div>

        {req.message && <p className="rounded-lg bg-[#F1EEE6] p-2.5 text-[12px] text-neutral-700">"{req.message}"</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => respond("reject")}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#F1EEE6] py-2.5 text-[13px] font-bold text-[#0F2238] disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" /> Decline
          </button>
          <button
            onClick={() => respond("accept")}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#C28D2E] py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" /> Accept
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, gradient, iconBg, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`relative overflow-hidden rounded-2xl p-4 text-left shadow-sm ${gradient} disabled:cursor-default`}
    >
      <span className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/10" />
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className="h-[18px] w-[18px] text-white" />
      </span>
      <p className="mt-3 truncate text-2xl font-extrabold text-white">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/75">{label}</p>
    </button>
  )
}

export default function IncomingRequests() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [wallet, setWallet] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [isOnline, setIsOnline] = useState(user?.isOnline !== false)
  const [togglingOnline, setTogglingOnline] = useState(false)
  const [locationError, setLocationError] = useState("")
  const [stats, setStats] = useState(null)

  useEffect(() => {
    apiFetch("/transporter-ops/dashboard").then(setStats).catch(() => {})
  }, [])

  useEffect(() => {
    Promise.allSettled([apiFetch("/transport/requests/incoming"), apiFetch("/payments/wallet"), apiFetch("/notifications")]).then(
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

  // Scoped to this page (not the shared app-wide socket singleton) so it
  // always authenticates with the transporter session, regardless of what
  // other role might already be logged in elsewhere in this browser tab.
  useEffect(() => {
    const { accessToken } = getSession("transporter")
    const socket = io(SOCKET_URL, { auth: { token: accessToken }, transports: ["websocket", "polling"] })
    const onNew = (request) => {
      setRequests((prev) => [request, ...prev.filter((r) => r._id !== request._id)])
    }
    const onUpdate = (updated) => {
      // A change to one customer on a shared run changes the whole run's status, which the server works out.
      if (updated.sharedGroup) {
        apiFetch("/transport/requests/incoming")
          .then((data) => setRequests(data.requests || []))
          .catch(() => {})
        return
      }
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)))
    }
    // An open request another transporter accepted (or the user cancelled) leaves this list.
    const onTaken = ({ requestId }) => setRequests((prev) => prev.filter((r) => r._id !== requestId))
    socket.on("transport:new", onNew)
    socket.on("transport:update", onUpdate)
    socket.on("transport:taken", onTaken)
    return () => {
      socket.off("transport:new", onNew)
      socket.off("transport:update", onUpdate)
      socket.off("transport:taken", onTaken)
      socket.disconnect()
    }
  }, [])

  const respond = async (id, action) => {
    setResponding(true)
    try {
      const data = await apiFetch(`/transport/requests/${id}/respond`, { method: "PATCH", body: { action } })
      setRequests((prev) =>
        data.request.declined ? prev.filter((r) => r._id !== id) : prev.map((r) => (r._id === id ? data.request : r))
      )
    } catch (err) {
      // Someone else accepted first: drop it from the list.
      if (err.status === 409 || /already accepted/i.test(err.message || "")) setRequests((prev) => prev.filter((r) => r._id !== id))
      throw err
    } finally {
      setResponding(false)
    }
  }

  const saveAvailability = async (nextOnline, location) => {
    const data = await apiFetch("/transporters/me/availability", {
      method: "PATCH",
      body: location ? { isOnline: nextOnline, location } : { isOnline: nextOnline },
    })
    const { accessToken, refreshToken } = getSession("transporter")
    login({ accessToken, refreshToken, user: { ...user, ...data.transporter, role: "transporter" } })
  }

  const toggleOnline = async () => {
    const next = !isOnline
    setTogglingOnline(true)
    setLocationError("")
    try {
      if (next) {
        const location = await getCurrentLocation()
        await saveAvailability(true, location)
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

  // While online, keep the saved location fresh so users are matched against where the transporter is now.
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

  // Every number and list on this page comes from the same bookings list and the same status rules as the Bookings page.
  // A shared run is one trip, so it is counted and listed once.
  const allTrips = useMemo(() => toTrips(requests), [requests])
  const counts = useMemo(() => countByGroup(allTrips), [allTrips])
  const enquiries = useMemo(() => requests.filter((r) => r.status === "pending"), [requests])
  // Home shows what is happening now: trips on the road first, then the next upcoming ones.
  const trips = useMemo(
    () => [
      ...sortForGroup(allTrips.filter((t) => groupOf(t) === "on_trip"), "on_trip"),
      ...sortForGroup(allTrips.filter((t) => groupOf(t) === "upcoming"), "upcoming"),
    ],
    [allTrips]
  )
  const HOME_TRIPS = 3

  const firstName = (user?.name || "there").split(" ")[0]
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div>
          <p className="text-xs text-neutral-500">{today}</p>
          <h1 className="text-xl font-extrabold text-[#0F2238]">Hi, {firstName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/transporter/notifications")} className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
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

      {stats && (
        <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
          {[
            ["Completed", counts.completed],
            ["Free vehicles", `${stats.availableVehicles}/${stats.vehicles}`],
            ["Drivers", stats.drivers],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#E4E1D8] bg-white p-2.5 text-center">
              <p className="text-base font-extrabold text-[#0F2238]">{value}</p>
              <p className="text-[10px] font-semibold text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Profile card */}
      <div className="mx-4 mt-3 flex items-center gap-4 rounded-2xl bg-[#0B1C33] p-4 shadow-[0_6px_12px_rgba(11,28,51,0.2)]">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#C28D2E]">
          <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#132B4A]">
            <Truck className="h-[26px] w-[26px] text-[#C28D2E]" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-white">{user?.businessName || user?.name || "Transporter"}</p>
          <p className="mt-0.5 text-[12px] text-[#A9B8CC]">{user?.phone}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-[#132B4A] px-2 py-0.5 text-[10px] font-bold capitalize text-[#C28D2E]">
              {user?.serviceType === "both" ? "Private & Shared" : user?.serviceType || "private"}
            </span>
            {user?.serviceArea && (
              <span className="flex items-center gap-1 rounded-full bg-[#132B4A] px-2 py-0.5 text-[10px] font-bold text-[#A9B8CC]">
                <MapPin className="h-2.5 w-2.5" />
                {user.serviceArea}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <StatCard
          icon={Clock}
          label="New requests"
          value={loading ? "—" : counts.new}
          gradient="bg-gradient-to-br from-amber-400 to-amber-600"
          iconBg="bg-white/20"
        />
        <StatCard
          icon={Activity}
          label="On trip now"
          value={loading ? "—" : counts.on_trip}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          iconBg="bg-white/20"
          onClick={() => navigate("/transporter/bookings")}
        />
        <StatCard
          icon={WalletIcon}
          label="Wallet balance"
          value={loading ? "—" : fmt(wallet?.balance)}
          gradient="bg-gradient-to-br from-[#C28D2E] to-[#8A6416]"
          iconBg="bg-white/20"
          onClick={() => navigate("/transporter/wallet")}
        />
        <StatCard
          icon={Layers}
          label="Upcoming"
          value={loading ? "—" : counts.upcoming}
          gradient="bg-gradient-to-br from-[#132B4A] to-[#0B1C33]"
          iconBg="bg-white/15"
          onClick={() => navigate("/transporter/bookings")}
        />
      </div>

      {/* New enquiries */}
      <div className="mt-6 flex items-center justify-between px-4">
        <h2 className="text-[15px] font-extrabold text-[#0F2238]">New Enquiries</h2>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">{enquiries.length}</span>
      </div>
      {!loading && enquiries.length === 0 ? (
        <p className="mx-4 mt-3 rounded-2xl border border-dashed border-[#D8D3C5] bg-white px-6 py-6 text-center text-[12px] text-neutral-500">
          No new enquiries. Requests from users show up here.
        </p>
      ) : (
        <div className="mt-3 space-y-3 px-4">
          {enquiries.map((req) => (
            <EnquiryCard key={req._id} req={req} onRespond={respond} busy={responding} />
          ))}
        </div>
      )}

      {/* Current and upcoming trips: a short view; the Bookings page has everything. */}
      <div className="mt-6 flex items-center justify-between px-4">
        <h2 className="text-[15px] font-extrabold text-[#0F2238]">Your trips</h2>
        <button onClick={() => navigate("/transporter/bookings")} className="text-[12px] font-bold text-[#C28D2E]">
          All bookings →
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : trips.length === 0 ? (
        <div className="mx-4 mt-3 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#D8D3C5] bg-white px-6 py-10 text-center">
          <Truck className="h-8 w-8 text-neutral-400" />
          <p className="text-sm font-semibold text-[#0F2238]">No trips right now</p>
          <p className="text-[12px] text-neutral-500">Requests you accept appear here.</p>
        </div>
      ) : (
        <div className="mt-3 space-y-3 px-4">
          {trips.slice(0, HOME_TRIPS).map((req) => (
            <BookingCard key={req._id} req={req} />
          ))}
          {trips.length > HOME_TRIPS && (
            <button
              onClick={() => navigate("/transporter/bookings")}
              className="w-full rounded-xl border border-[#E4E1D8] bg-white py-2.5 text-xs font-bold text-[#0F2238]"
            >
              See {trips.length - HOME_TRIPS} more
            </button>
          )}
        </div>
      )}

    </div>
  )
}
