import { useLocation, useNavigate } from "react-router-dom"
import { Calendar, Home, User, Wallet } from "lucide-react"

const tabs = [
  { key: "Home", label: "Home", path: "/transporter", icon: Home },
  { key: "Bookings", label: "Bookings", path: "/transporter/bookings", icon: Calendar },
  { key: "Wallet", label: "Wallet", path: "/transporter/wallet", icon: Wallet },
  { key: "Profile", label: "Profile", path: "/transporter/profile", icon: User },
]

// Matches the floating navy tab bar style used in the UserApp web build
// (see modules/user/layout/BottomTabBar.jsx) for a consistent cross-app feel.
export default function BottomTabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => (path === "/transporter" ? location.pathname === "/transporter" : location.pathname.startsWith(path))

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3 pt-2">
      <div className="flex w-full max-w-[480px] gap-1 rounded-2xl border border-[#132B4A] bg-[#0B1C33] px-1.5 py-2 shadow-[0_8px_16px_rgba(0,0,0,0.18)]">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => navigate(tab.path)}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1"
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} color={active ? "#C28D2E" : "#A9B8CC"} />
              <span className={`text-[11px] ${active ? "font-bold text-[#C28D2E]" : "font-medium text-[#A9B8CC]"}`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
