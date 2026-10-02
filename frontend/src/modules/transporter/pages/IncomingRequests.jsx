import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import { BellRing, CheckCircle2, Clock, LogOut, MapPin, Phone, XCircle } from "lucide-react"
import { apiFetch, getSession } from "@/shared/lib/api"
import { useAuth } from "@/shared/context/AuthContext"

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")

const STATUS_META = {
  pending: { label: "Pending", color: "#f59e0b", icon: Clock },
  accepted: { label: "Accepted", color: "#16a34a", icon: CheckCircle2 },
  rejected: { label: "Declined", color: "#ef4444", icon: XCircle },
  cancelled: { label: "Cancelled", color: "#64748B", icon: XCircle },
}

export default function IncomingRequests() {
  const { logout } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [ringing, setRinging] = useState(null)

  useEffect(() => {
    apiFetch("/transport/requests/incoming")
      .then((data) => setRequests(data.requests || []))
      .finally(() => setLoading(false))
  }, [])

  // Scoped to this page (not the shared app-wide socket singleton) so it
  // always authenticates with the transporter session, regardless of what
  // other role might already be logged in elsewhere in this browser tab.
  useEffect(() => {
    const { accessToken } = getSession("transporter")
    const socket = io(SOCKET_URL, { auth: { token: accessToken }, transports: ["websocket", "polling"] })
    const onNew = (request) => {
      setRequests((prev) => [request, ...prev.filter((r) => r._id !== request._id)])
      setRinging(request)
    }
    socket.on("transport:new", onNew)
    return () => {
      socket.off("transport:new", onNew)
      socket.disconnect()
    }
  }, [])

  const respond = async (id, action) => {
    setResponding(true)
    try {
      const data = await apiFetch(`/transport/requests/${id}/respond`, { method: "PATCH", body: { action } })
      setRequests((prev) => prev.map((r) => (r._id === id ? data.request : r)))
      if (ringing?._id === id) setRinging(null)
    } finally {
      setResponding(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between bg-[#0B1C33] px-4 py-4">
        <div>
          <h1 className="text-[18px] font-bold text-white">Incoming Requests</h1>
          <p className="mt-0.5 text-xs text-[#A9B8CC]">Transport enquiries from users</p>
        </div>
        <button onClick={logout} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#132B4A]">
          <LogOut className="h-[18px] w-[18px] text-white" />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 px-8 py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-8 py-20 text-center">
          <BellRing className="h-8 w-8 text-neutral-400" />
          <p className="text-[13px] text-neutral-500">No requests yet. You&apos;ll be notified the moment one arrives.</p>
        </div>
      ) : (
        <div className="space-y-2.5 p-4">
          {requests.map((req) => {
            const meta = STATUS_META[req.status]
            const StatusIcon = meta.icon
            return (
              <div key={req._id} className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex-1 truncate text-sm font-bold text-[#0F2238]">{req.user?.name || req.user?.phone}</p>
                  <span
                    className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold"
                    style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {meta.label}
                  </span>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-neutral-500">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  {req.source.address} → {req.destination.address}
                </p>
                <p className="mt-1.5 text-[11px] font-semibold text-neutral-500">{req.type === "shared" ? "Shared ride" : "Private transport"}</p>

                {req.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => respond(req._id, "reject")}
                      disabled={responding}
                      className="flex-1 rounded-xl bg-[#F1EEE6] py-2.5 text-[13px] font-bold text-[#0F2238] disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => respond(req._id, "accept")}
                      disabled={responding}
                      className="flex-1 rounded-xl bg-[#C28D2E] py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
                    >
                      Accept
                    </button>
                  </div>
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
            <h2 className="text-base font-bold text-[#0F2238]">New Transport Enquiry</h2>
            <p className="mt-2 text-xl font-extrabold text-[#0F2238]">{ringing.user?.name || ringing.user?.phone}</p>
            <p className="mt-1 text-[13px] text-neutral-500">
              {ringing.source.address} → {ringing.destination.address}
            </p>
            <div className="mt-8 flex justify-center gap-6">
              <button
                onClick={() => respond(ringing._id, "reject")}
                disabled={responding}
                className="flex h-[88px] w-[88px] flex-col items-center justify-center gap-1.5 rounded-full bg-[#ef4444] text-white disabled:opacity-60"
              >
                <XCircle className="h-[22px] w-[22px]" />
                <span className="text-xs font-bold">Decline</span>
              </button>
              <button
                onClick={() => respond(ringing._id, "accept")}
                disabled={responding}
                className="flex h-[88px] w-[88px] flex-col items-center justify-center gap-1.5 rounded-full bg-[#16a34a] text-white disabled:opacity-60"
              >
                <CheckCircle2 className="h-[22px] w-[22px]" />
                <span className="text-xs font-bold">Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
