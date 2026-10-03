import { useNavigate } from "react-router-dom"
import {
  ChevronRight,
  Heart,
  Info,
  LifeBuoy,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Settings as SettingsIcon,
  User as UserIcon,
} from "lucide-react"
import { useAuth } from "@/shared/context/AuthContext"
import { useWishlist } from "../context/WishlistContext"
import BackButton from "../components/BackButton"

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
  const { horses: savedHorses } = useWishlist()
  const navigate = useNavigate()

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return
    await logout()
    navigate("/user/login")
  }

  const accountItems = [
    {
      key: "addresses",
      label: "Saved Addresses",
      sublabel: "Manage your delivery addresses",
      icon: MapPin,
      iconBg: "#E1ECFC",
      iconColor: "#2563EB",
      onPress: () => navigate("/user/addresses"),
    },
    {
      key: "orders",
      label: "Your Orders",
      sublabel: "Track accessories store orders",
      icon: Package,
      iconBg: "#F0E4FB",
      iconColor: "#7C3AED",
      onPress: () => navigate("/user/orders"),
    },
    {
      key: "saved-horses",
      label: "Saved Horses",
      sublabel: savedHorses.length ? `${savedHorses.length} horse${savedHorses.length > 1 ? "s" : ""} shortlisted` : "Horses you have shortlisted",
      icon: Heart,
      iconBg: "#FBEFD6",
      iconColor: "#C28D2E",
      onPress: () => navigate("/user/wishlist"),
    },
  ]

  const moreItems = [
    {
      key: "support",
      label: "Help & Support",
      icon: LifeBuoy,
      iconBg: "#E0F4E7",
      iconColor: "#16A34A",
      onPress: () => navigate("/user/help"),
    },
    {
      key: "about",
      label: "About Ashwa India",
      icon: Info,
      iconBg: "#E1ECFC",
      iconColor: "#2563EB",
      onPress: () => navigate("/user/about"),
    },
    {
      key: "settings",
      label: "Settings",
      icon: SettingsIcon,
      iconBg: "#F1EEE6",
      iconColor: "#64748B",
      onPress: () => navigate("/user/settings"),
    },
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
            <UserIcon className="h-[26px] w-[26px] text-[#C28D2E]" />
          </div>
        </div>
        <div>
          <p className="text-lg font-bold text-white">{user?.name || "User"}</p>
          <p className="mt-0.5 text-[13px] text-[#A9B8CC]">{user?.phone}</p>
        </div>
      </div>

      <button
        onClick={() => navigate("/user/profile/edit")}
        className="mx-4 mt-2.5 flex items-center justify-center gap-1.5 rounded-xl border border-[#E4E1D8] bg-white py-3 hover:bg-[#F6E9C9]"
      >
        <Pencil className="h-[15px] w-[15px] text-[#C28D2E]" />
        <span className="text-[13px] font-bold text-[#C28D2E]">Edit Profile</span>
      </button>

      <MenuSection title="Account" items={accountItems} />
      <MenuSection title="More" items={moreItems} />

      <button
        onClick={handleLogout}
        className="mx-4 mt-6 flex items-center gap-2.5 rounded-2xl border border-[#E4E1D8] bg-white px-4 py-3.5 hover:bg-rose-50"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE2E2]">
          <LogOut className="h-[18px] w-[18px] text-[#ef4444]" />
        </span>
        <span className="text-sm font-bold text-[#ef4444]">Log out</span>
      </button>
    </div>
  )
}
