import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Bell, Trash2, X } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

const DISMISSED_KEY = "ashwa_provider_notifications_dismissed"

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function Notifications() {
  const navigate = useNavigate()
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]")
    } catch {
      return []
    }
  })

  useEffect(() => {
    apiFetch("/notifications")
      .then((data) => setAll(data.notifications || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedIds))
  }, [dismissedIds])

  const notifications = all.filter((n) => !dismissedIds.includes(n._id))
  const dismiss = (id) => setDismissedIds((prev) => [...prev, id])
  const dismissAll = () => setDismissedIds(all.map((n) => n._id))

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 bg-[#0B1C33] p-4">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#132B4A]">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="flex-1 text-[17px] font-bold text-white">Notifications</h1>
        {notifications.length > 0 && (
          <button onClick={dismissAll} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#132B4A]">
            <Trash2 className="h-[18px] w-[18px] text-rose-300" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-8 py-16 text-center">
          <Bell className="h-7 w-7 text-neutral-400" />
          <p className="text-sm text-neutral-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5 p-4">
          {notifications.map((item) => (
            <div key={item._id} className="flex items-start gap-2.5 rounded-2xl border border-[#E4E1D8] bg-white p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6E9C9]">
                <Bell className="h-4 w-4 text-[#C28D2E]" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#0F2238]">{item.title}</p>
                <p className="mt-0.5 text-[13px] leading-[18px] text-neutral-500">{item.message}</p>
                <p className="mt-0.5 text-[11px] text-neutral-500">{timeAgo(item.createdAt)}</p>
              </div>
              <button onClick={() => dismiss(item._id)} className="flex h-7 w-7 items-center justify-center text-neutral-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
