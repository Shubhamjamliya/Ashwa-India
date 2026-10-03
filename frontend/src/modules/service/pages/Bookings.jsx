import { useEffect, useMemo, useState } from "react"
import { Calendar, CheckCircle2, MapPin, XCircle } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import BackButton from "../components/BackButton"

const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

const tabs = [
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Declined" },
  { key: "cancelled", label: "Cancelled" },
]

const statusMeta = {
  completed: { label: "Completed", color: "#16a34a", icon: CheckCircle2 },
  rejected: { label: "Declined", color: "#ef4444", icon: XCircle },
  cancelled: { label: "Cancelled", color: "#64748B", icon: XCircle },
}

export default function Bookings() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("completed")

  useEffect(() => {
    apiFetch("/services/requests/incoming")
      .then((data) => setRequests((data.requests || []).filter((r) => r.status !== "pending" && r.status !== "accepted")))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => requests.filter((r) => r.status === tab), [requests, tab])

  return (
    <div className="min-h-screen">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <BackButton variant="dark" />
        <div>
          <h1 className="text-[18px] font-bold text-white">Bookings</h1>
          <p className="mt-0.5 text-xs text-[#A9B8CC]">Your service job history</p>
        </div>
      </div>

      <div className="flex gap-1.5 px-4 pt-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-bold ${
              tab === t.key ? "bg-[#0B1C33] text-white" : "border border-[#E4E1D8] bg-white text-neutral-600"
            }`}
          >
            {t.label} ({requests.filter((r) => r.status === t.key).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-8 py-20 text-center">
          <Calendar className="h-8 w-8 text-neutral-400" />
          <p className="text-[13px] text-neutral-500">No {tabs.find((t) => t.key === tab)?.label.toLowerCase()} bookings.</p>
        </div>
      ) : (
        <div className="space-y-2.5 p-4">
          {filtered.map((req) => {
            const meta = statusMeta[req.status]
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
                <p className="mt-2 text-[12px] font-semibold capitalize text-neutral-600">{req.serviceType}</p>
                {req.message && <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{req.message}</p>}
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="flex items-center gap-1 text-[11px] text-neutral-500">
                    <MapPin className="h-3 w-3" />
                    {req.user?.phone}
                  </p>
                  <p className="text-[11px] text-neutral-400">{fmtDate(req.completedAt || req.respondedAt || req.createdAt)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
