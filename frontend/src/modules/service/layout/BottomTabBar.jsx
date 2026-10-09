import { useLocation, useNavigate } from "react-router-dom"
import { Calendar, Home, Plus, User, Wallet } from "lucide-react"

const left = [
  { key: "Home", label: "Home", path: "/service", icon: Home },
  { key: "Bookings", label: "Bookings", path: "/service/bookings", icon: Calendar },
]
const right = [
  { key: "Wallet", label: "Wallet", path: "/service/wallet", icon: Wallet },
  { key: "Profile", label: "Profile", path: "/service/profile", icon: User },
]

export default function BottomTabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => (path === "/service" ? location.pathname === "/service" : location.pathname.startsWith(path))

  const renderTab = (tab) => {
    const active = isActive(tab.path)
    const Icon = tab.icon
    return (
      <button key={tab.key} type="button" onClick={() => navigate(tab.path)} className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full transition ${active ? "bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/40" : ""}`}>
          <Icon className="h-[22px] w-[22px]" strokeWidth={2} color={active ? "#FFFFFF" : "#6B7A99"} />
        </span>
        <span className={`text-[11px] ${active ? "font-bold text-indigo-600" : "font-medium text-[#6B7A99]"}`}>{tab.label}</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 pt-2">
      <div className="relative flex w-full max-w-[480px] items-center rounded-[28px] bg-white px-2 py-2 shadow-[0_8px_30px_rgba(30,50,120,0.18)]">
        {left.map(renderTab)}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            aria-label="Post a job"
            onClick={() => navigate("/service/jobs/new")}
            className="-mt-9 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xl shadow-indigo-500/40 active:scale-95"
          >
            <Plus className="h-8 w-8" />
          </button>
        </div>
        {right.map(renderTab)}
      </div>
    </div>
  )
}
