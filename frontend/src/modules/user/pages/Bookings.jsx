import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import { Calendar, CheckCircle2, Clock, MapPin, XCircle } from "lucide-react"
import { apiFetch, getSession } from "@/shared/lib/api"

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")

const STATUS_META = {
  pending: { label: "Waiting for response", color: "#f59e0b", icon: Clock },
  accepted: { label: "Accepted", color: "#16a34a", icon: CheckCircle2 },
  rejected: { label: "Declined", color: "#ef4444", icon: XCircle },
  cancelled: { label: "Cancelled", color: "#64748B", icon: XCircle },
}

export default function Bookings() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch("/transport/requests/mine")
      .then((data) => setRequests(data.requests || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const { accessToken } = getSession("user")
    if (!accessToken) return
    const socket = io(SOCKET_URL, { auth: { token: accessToken }, transports: ["websocket", "polling"] })
    const onUpdate = (updated) => {
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)))
    }
    socket.on("transport:update", onUpdate)
    return () => {
      socket.off("transport:update", onUpdate)
      socket.disconnect()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-8 text-center">
        <Calendar className="h-8 w-8 text-neutral-400" />
        <p className="text-base font-semibold text-[#0F2238]">No bookings yet</p>
        <p className="text-[13px] text-neutral-500">Your service, transport and marketplace bookings will show up here.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="px-4 pt-5 pb-2 text-[17px] font-bold text-[#0F2238]">Transport Requests</h1>
      <div className="space-y-2.5 px-4 pb-4">
        {requests.map((item) => {
          const meta = STATUS_META[item.status]
          const StatusIcon = meta.icon
          return (
            <div key={item._id} className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex-1 truncate text-sm font-bold text-[#0F2238]">
                  {item.transporter?.businessName || item.transporter?.name || "Transporter"}
                </p>
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold"
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
              <p className="mt-1.5 text-[11px] font-semibold text-neutral-500">
                {item.type === "shared" ? "Shared ride" : "Private transport"}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
