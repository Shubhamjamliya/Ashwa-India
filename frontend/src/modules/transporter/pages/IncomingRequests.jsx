import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import { BellRing, Check, MapPin, X } from "lucide-react"
import { apiFetch, getSession } from "@/shared/lib/api"

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")

const statusBadge = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-neutral-100 text-neutral-600 border-neutral-200",
}

export default function IncomingRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState(null)
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
    setActingId(id)
    try {
      const data = await apiFetch(`/transport/requests/${id}/respond`, { method: "PATCH", body: { action } })
      setRequests((prev) => prev.map((r) => (r._id === id ? data.request : r)))
      if (ringing?._id === id) setRinging(null)
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F2238]">Incoming Requests</h1>
        <p className="text-sm text-neutral-500">Transport enquiries from users</p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white py-16 text-center">
          <BellRing className="mb-3 h-10 w-10 text-neutral-300" />
          <h2 className="text-lg font-bold text-[#0F2238]">No requests yet</h2>
          <p className="text-sm text-neutral-500">You'll be notified the moment one arrives.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req._id} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[#0F2238]">{req.user?.name || req.user?.phone}</p>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusBadge[req.status] || ""}`}>
                  {req.status}
                </span>
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-neutral-600">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {req.source.address} → {req.destination.address}
              </p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                {req.type === "shared" ? "Shared ride" : "Private transport"}
              </p>

              {req.status === "pending" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => respond(req._id, "reject")}
                    disabled={actingId === req._id}
                    className="flex-1 rounded-xl bg-neutral-100 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => respond(req._id, "accept")}
                    disabled={actingId === req._id}
                    className="flex-1 rounded-xl bg-[#C28D2E] py-2 text-sm font-bold text-white hover:bg-[#d49f3d] disabled:opacity-50"
                  >
                    Accept
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {ringing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#C28D2E]">
              <BellRing className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-bold text-[#0F2238]">New Transport Enquiry</h2>
            <p className="mt-2 text-xl font-extrabold text-[#0F2238]">{ringing.user?.name || ringing.user?.phone}</p>
            <p className="mt-1 text-sm text-neutral-500">
              {ringing.source.address} → {ringing.destination.address}
            </p>
            <div className="mt-6 flex justify-center gap-6">
              <button
                onClick={() => respond(ringing._id, "reject")}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <button
                onClick={() => respond(ringing._id, "accept")}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white"
              >
                <Check className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
