import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { useAuth } from "@/shared/context/AuthContext"

export default function ServiceDashboard() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch("/notifications")
      .then((data) => setNotifications(data.notifications || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-[#0B1C33] p-6 text-white">
        <p className="text-lg font-bold">Welcome, {user?.name || "Provider"}</p>
        <p className="text-sm text-[#A9B8CC]">{user?.businessName || "Ashwa India Service Provider"}</p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-extrabold text-[#0F2238]">Notifications</h2>
        {loading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white py-16 text-center">
            <Bell className="mb-3 h-10 w-10 text-neutral-300" />
            <p className="text-sm text-neutral-500">Nothing here yet — you'll see updates from Ashwa India as they come in.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n._id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <p className="text-sm font-bold text-[#0F2238]">{n.title}</p>
                <p className="mt-1 text-sm text-neutral-600">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
