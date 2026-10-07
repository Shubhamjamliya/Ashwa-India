import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Menu, Search, User, ChevronDown, LogOut, Settings, Bell, BellOff } from "lucide-react"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/shared/components/ui/dropdown-menu"
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { roles } from "@/shared/constants/sidebarMenus"
import { useAuth } from "@/shared/context/AuthContext"
import { useSellerNotifications } from "@/shared/context/SellerNotificationsContext"

const notifTime = (d) => {
  const diffMs = Date.now() - new Date(d).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export default function AppNavbar({ onMenuClick, role = "admin" }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef(null)
  const { items: notifications, unreadCount, markAllRead } = useSellerNotifications()

  const roleInfo = roles[role]
  const userData = {
    name: user?.name || user?.businessName || roleInfo.label,
    email: user?.email || user?.phone || "",
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === "Escape" && searchOpen) setSearchOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [searchOpen])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100)
  }, [searchOpen])

  const handleLogout = async () => {
    await logout()
    if (role === "horse-seller" || role === "store-seller") {
      navigate(`/seller/login?type=${role}`, { replace: true })
    } else {
      navigate("/admin/login", { replace: true })
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-neutral-700 hover:bg-neutral-100"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex justify-center max-w-md">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors w-full border border-neutral-200"
            >
              <Search className="w-4 h-4 text-neutral-700" />
              <span className="text-sm flex-1 text-left text-neutral-700">Search</span>
              <span className="text-xs px-2 py-0.5 rounded bg-white text-neutral-500 border border-neutral-200">Ctrl+K</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Popover
              open={notificationsOpen}
              onOpenChange={(open) => {
                setNotificationsOpen(open)
                if (open && unreadCount > 0) markAllRead()
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative h-10 w-10 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 flex items-center justify-center hover:bg-neutral-100"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="px-4 py-3 border-b border-neutral-200">
                  <p className="text-sm font-semibold text-neutral-900">Notifications</p>
                </div>
                {notifications.length === 0 ? (
                  <div className="max-h-80 overflow-y-auto flex flex-col items-center gap-2 px-6 py-10 text-center">
                    <BellOff className="w-8 h-8 text-neutral-300" />
                    <p className="text-sm text-neutral-500">No notifications yet</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false)
                          if (n.link) navigate(n.link)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-neutral-50 flex items-start gap-2"
                      >
                        {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />}
                        <div className={`min-w-0 flex-1 ${n.read ? "pl-3.5" : ""}`}>
                          <p className="truncate text-sm font-semibold text-neutral-900">{n.title}</p>
                          <p className="line-clamp-2 text-xs text-neutral-500">{n.body}</p>
                          <p className="mt-0.5 text-[11px] text-neutral-400">{notifTime(n.time)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 pl-3 border-l border-neutral-200 cursor-pointer hover:bg-neutral-100 rounded-md px-2 py-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                    {userData.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-neutral-900">{userData.name}</p>
                    <p className="text-xs text-neutral-500">{userData.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-700 hidden md:block" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate(`${roleInfo.homePath}/profile`)}>
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  {role === "admin" && (
                    <DropdownMenuItem onClick={() => navigate("/admin/system/business-setup")}>
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-xl p-0">
          <DialogHeader className="p-5 pb-3 border-b border-neutral-200">
            <DialogTitle>Universal Search</DialogTitle>
          </DialogHeader>
          <div className="p-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search users, horses, orders, bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-sm text-neutral-400 mt-6 text-center">
              Start typing to search across the platform
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
