import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, MapPin, Phone, Route, Truck, X } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

const tabs = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "cancelled", label: "Cancelled" },
]

const statusBadgeClass = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-neutral-100 text-neutral-600 border-neutral-200",
}

export default function AdminTransportRequests() {
  const [requests, setRequests] = useState([])
  const [statusTab, setStatusTab] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      const query = statusTab ? `?status=${statusTab}` : ""
      const data = await apiFetch(`/transport/requests${query}`)
      setRequests(data.requests || [])
    } catch (err) {
      setError(err.message || "Failed to load transport requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab])

  const summary = useMemo(() => {
    const counts = { pending: 0, accepted: 0, rejected: 0, cancelled: 0 }
    requests.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status] += 1
    })
    return counts
  }, [requests])

  const handleCancel = async (request) => {
    if (!window.confirm("Cancel this transport request?")) return
    setCancellingId(request._id)
    try {
      const data = await apiFetch(`/transport/requests/${request._id}/cancel`, { method: "PATCH" })
      setRequests((prev) => prev.map((r) => (r._id === request._id ? data.request : r)))
      setSelected((prev) => (prev && prev._id === request._id ? data.request : prev))
    } catch (err) {
      setError(err.message || "Failed to cancel request")
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Transport Requests</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500">
              Every transport enquiry a user has sent to a transporter, across the whole platform.
            </p>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-neutral-200 p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusTab(t.key)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${
                  statusTab === t.key ? "bg-neutral-900 text-white" : "text-neutral-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { key: "pending", label: "Pending", color: "text-amber-600" },
          { key: "accepted", label: "Accepted", color: "text-emerald-600" },
          { key: "rejected", label: "Rejected", color: "text-rose-600" },
          { key: "cancelled", label: "Cancelled", color: "text-neutral-500" },
        ].map((s) => (
          <div key={s.key} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{summary[s.key]}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="w-[26%] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Route</th>
                <th className="w-[18%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">User</th>
                <th className="w-[20%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Transporter</th>
                <th className="w-[10%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Type</th>
                <th className="w-[12%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-neutral-600">Status</th>
                <th className="w-[14%] px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-neutral-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-neutral-500">Loading transport requests...</p>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Truck className="mx-auto h-8 w-8 text-neutral-300" />
                    <p className="mt-2 text-lg font-semibold text-neutral-700">No transport requests found</p>
                    <p className="mt-1 text-sm text-neutral-500">Enquiries users send to transporters will show up here.</p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="cursor-pointer align-top hover:bg-neutral-50/80" onClick={() => setSelected(req)}>
                    <td className="px-5 py-5">
                      <p className="flex items-start gap-1.5 text-sm text-neutral-700">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        <span className="line-clamp-2">
                          {req.source?.address} → {req.destination?.address}
                        </span>
                      </p>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-sm font-semibold text-neutral-900">{req.user?.name || "User"}</p>
                      <p className="text-xs text-neutral-500">{req.user?.phone}</p>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-sm font-semibold text-neutral-900">
                        {req.transporter?.businessName || req.transporter?.name || "Transporter"}
                      </p>
                      <p className="text-xs text-neutral-500">{req.transporter?.phone}</p>
                    </td>
                    <td className="px-4 py-5 text-sm capitalize text-neutral-600">{req.type}</td>
                    <td className="px-4 py-5 text-center">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusBadgeClass[req.status]}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-right text-xs text-neutral-500">{fmtDate(req.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selected && (
              <div className="fixed inset-0 z-[200]">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setSelected(null)}
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "tween", duration: 0.25 }}
                  className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900">Transport Request</h2>
                      <p className="text-xs text-neutral-500">{fmtDate(selected.createdAt)}</p>
                    </div>
                    <button onClick={() => setSelected(null)} className="rounded-lg p-1 hover:bg-neutral-100">
                      <X className="h-5 w-5 text-neutral-500" />
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
                    <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass[selected.status]}`}>
                      {selected.status}
                    </span>

                    <div>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Route</h3>
                      <div className="space-y-2 rounded-xl border border-neutral-200 p-4 text-sm">
                        <div className="flex items-start gap-2">
                          <Route className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>{selected.source?.address}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                          <span>{selected.destination?.address}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs font-semibold capitalize text-neutral-500">{selected.type} transport</p>
                    </div>

                    <div>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">User</h3>
                      <div className="rounded-xl border border-neutral-200 p-4">
                        <p className="text-sm font-semibold text-neutral-900">{selected.user?.name || "User"}</p>
                        {selected.user?.phone && (
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
                            <Phone className="h-3.5 w-3.5" /> {selected.user.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Transporter</h3>
                      <div className="rounded-xl border border-neutral-200 p-4">
                        <p className="text-sm font-semibold text-neutral-900">
                          {selected.transporter?.businessName || selected.transporter?.name || "Transporter"}
                        </p>
                        {selected.transporter?.phone && (
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
                            <Phone className="h-3.5 w-3.5" /> {selected.transporter.phone}
                          </div>
                        )}
                        {selected.transporter?.vehicleTypes?.length > 0 && (
                          <p className="mt-1 text-xs text-neutral-500">{selected.transporter.vehicleTypes.join(", ")}</p>
                        )}
                      </div>
                    </div>

                    {selected.message && (
                      <div>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Message</h3>
                        <p className="rounded-xl border border-neutral-200 p-4 text-sm text-neutral-600">{selected.message}</p>
                      </div>
                    )}
                  </div>

                  {(selected.status === "pending" || selected.status === "accepted") && (
                    <div className="border-t bg-white px-6 py-4">
                      <button
                        onClick={() => handleCancel(selected)}
                        disabled={cancellingId === selected._id}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      >
                        {cancellingId === selected._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Cancel Request
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
