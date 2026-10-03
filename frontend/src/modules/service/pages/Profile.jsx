import { useNavigate } from "react-router-dom"
import { Bell, Calendar, ChevronRight, Info, LifeBuoy, LogOut, Percent, Pencil, Settings as SettingsIcon, Star, Stethoscope, Wallet } from "lucide-react"
import { useAuth } from "@/shared/context/AuthContext"
import BackButton from "../components/BackButton"

const STATUS_META = {
  pending: { label: "Pending Approval", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", className: "bg-rose-100 text-rose-700" },
  suspended: { label: "Suspended", className: "bg-neutral-200 text-neutral-700" },
}

function MenuSection({ title, items }) {
  return (
    <div className="mt-6 px-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
        {items.map((item, index) => (
          <button
            key={item.key}
            onClick={item.onPress}
            className={`flex w-full items-center gap-2.5 px-4 py-3.5 text-left hover:bg-[#F1EEE6] ${
              index !== items.length - 1 ? "border-b border-[#E4E1D8]" : ""
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: item.iconBg }}>
              <item.icon className="h-[19px] w-[19px]" style={{ color: item.iconColor }} />
            </span>
            <span className="flex-1">
              <p className="text-sm font-bold text-[#0F2238]">{item.label}</p>
              {item.sublabel && <p className="mt-0.5 text-xs text-neutral-500">{item.sublabel}</p>}
            </span>
            <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#F1EEE6]">
              <ChevronRight className="h-4 w-4 text-neutral-500" />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const statusMeta = STATUS_META[user?.status] || STATUS_META.pending

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return
    await logout()
    navigate("/service/login")
  }

  const accountItems = [
    {
      key: "wallet",
      label: "Wallet",
      sublabel: "Balance, top-ups and transactions",
      icon: Wallet,
      iconBg: "#FBEFD6",
      iconColor: "#C28D2E",
      onPress: () => navigate("/service/wallet"),
    },
    {
      key: "reviews",
      label: "Reviews & Ratings",
      sublabel: "What customers say about your service",
      icon: Star,
      iconBg: "#FBEFD6",
      iconColor: "#C28D2E",
      onPress: () => navigate("/service/reviews"),
    },
    {
      key: "earnings",
      label: "Earnings & Commission",
      sublabel: "What you earned after platform commission",
      icon: Percent,
      iconBg: "#E0F4E7",
      iconColor: "#16A34A",
      onPress: () => navigate("/service/earnings"),
    },
    {
      key: "bookings",
      label: "Booking History",
      sublabel: "Completed and declined jobs",
      icon: Calendar,
      iconBg: "#E1ECFC",
      iconColor: "#2563EB",
      onPress: () => navigate("/service/bookings"),
    },
    {
      key: "notifications",
      label: "Notifications",
      sublabel: "Updates from Ashwa India",
      icon: Bell,
      iconBg: "#F0E4FB",
      iconColor: "#7C3AED",
      onPress: () => navigate("/service/notifications"),
    },
  ]

  const moreItems = [
    { key: "support", label: "Help & Support", icon: LifeBuoy, iconBg: "#E0F4E7", iconColor: "#16A34A", onPress: () => navigate("/service/help") },
    { key: "about", label: "About Ashwa India", icon: Info, iconBg: "#E1ECFC", iconColor: "#2563EB", onPress: () => navigate("/service/about") },
    { key: "settings", label: "Settings", icon: SettingsIcon, iconBg: "#F1EEE6", iconColor: "#64748B", onPress: () => navigate("/service/settings") },
  ]

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between border-b border-[#E4E1D8] bg-white px-4 py-3">
        <BackButton />
        <h1 className="text-base font-bold text-[#0F2238]">Profile</h1>
        <span className="h-9 w-9" />
      </div>

      <div className="mx-4 mt-4 flex items-center gap-4 rounded-2xl bg-[#0B1C33] p-4 shadow-[0_6px_12px_rgba(11,28,51,0.2)]">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#C28D2E]">
          <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#132B4A]">
            <Stethoscope className="h-[26px] w-[26px] text-[#C28D2E]" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-white">{user?.businessName || user?.name || "Service Provider"}</p>
          <p className="mt-0.5 text-[13px] text-[#A9B8CC]">{user?.phone}</p>
          <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusMeta.className}`}>{statusMeta.label}</span>
        </div>
      </div>

      <button
        onClick={() => navigate("/service/profile/edit")}
        className="mx-4 mt-2.5 flex w-[calc(100%-2rem)] items-center justify-center gap-1.5 rounded-xl border border-[#E4E1D8] bg-white py-3 hover:bg-[#F6E9C9]"
      >
        <Pencil className="h-[15px] w-[15px] text-[#C28D2E]" />
        <span className="text-[13px] font-bold text-[#C28D2E]">Edit Profile</span>
      </button>

      <MenuSection title="Account" items={accountItems} />
      <MenuSection title="More" items={moreItems} />

      <button
        onClick={handleLogout}
        className="mx-4 mt-6 flex w-[calc(100%-2rem)] items-center gap-2.5 rounded-2xl border border-[#E4E1D8] bg-white px-4 py-3.5 hover:bg-rose-50"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE2E2]">
          <LogOut className="h-[18px] w-[18px] text-[#ef4444]" />
        </span>
        <span className="text-sm font-bold text-[#ef4444]">Log out</span>
      </button>
    </div>
  )
}
