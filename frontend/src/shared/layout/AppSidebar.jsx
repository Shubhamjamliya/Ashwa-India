import { useState, useEffect, useMemo, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Search, LayoutDashboard, Users, UserCog, Truck, Heart, Store, MessageSquare,
  Package, Building2, ShoppingBag, FileText, Route, MapPin, Calendar, CreditCard,
  DollarSign, Star, Bell, Headset, Settings, User, ChevronDown, ChevronRight,
  ChevronLeft, X,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/components/ui/input"

const iconMap = {
  LayoutDashboard, Users, UserCog, Truck, Heart, Store, MessageSquare, Package,
  Building2, ShoppingBag, FileText, Route, MapPin, Calendar, CreditCard,
  DollarSign, Star, Bell, Headset, Settings, User,
}

export default function AppSidebar({
  menu,
  brand = "Ashwa India",
  homePath = "/",
  isOpen = false,
  onClose,
  onCollapseChange,
}) {
  const location = useLocation()
  const itemRefs = useRef({})
  const [searchQuery, setSearchQuery] = useState("")

  const getInitialStates = () => {
    try {
      const saved = localStorage.getItem("app_sidebar_state")
      if (saved) return JSON.parse(saved)
    } catch (e) { /* ignore */ }
    return { isCollapsed: false, expandedSections: {} }
  }

  const [isCollapsed, setIsCollapsed] = useState(() => getInitialStates().isCollapsed)
  const [expandedSections, setExpandedSections] = useState(() => getInitialStates().expandedSections || {})

  useEffect(() => {
    try {
      const currentState = JSON.parse(localStorage.getItem("app_sidebar_state") || "{}")
      localStorage.setItem("app_sidebar_state", JSON.stringify({ ...currentState, isCollapsed }))
      onCollapseChange?.(isCollapsed)
    } catch (e) { /* ignore */ }
  }, [isCollapsed])

  useEffect(() => {
    onCollapseChange?.(isCollapsed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleCollapse = () => setIsCollapsed((prev) => !prev)

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  useEffect(() => {
    try {
      const currentState = JSON.parse(localStorage.getItem("app_sidebar_state") || "{}")
      localStorage.setItem("app_sidebar_state", JSON.stringify({ ...currentState, expandedSections }))
    } catch (e) { /* ignore */ }
  }, [expandedSections])

  const isActive = (path) => {
    const currentPath = location.pathname.replace(/\/+$/, "") || "/"
    const targetPath = String(path || "").replace(/\/+$/, "") || "/"
    if (targetPath === homePath) return currentPath === targetPath
    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
  }

  const filteredMenu = useMemo(() => {
    if (!searchQuery.trim()) return menu
    const query = searchQuery.toLowerCase().trim()
    const filtered = []
    menu.forEach((item) => {
      if (item.type === "link") {
        if (item.label.toLowerCase().includes(query)) filtered.push(item)
      } else if (item.type === "section") {
        const items = item.items.filter((sub) => sub.label.toLowerCase().includes(query))
        if (items.length > 0) filtered.push({ ...item, items })
      }
    })
    return filtered
  }, [searchQuery])

  const renderLink = (item, key, inSection = false) => {
    const Icon = iconMap[item.icon] || LayoutDashboard
    return (
      <Link
        key={key}
        to={item.path}
        ref={(el) => {
          if (el) itemRefs.current[item.path] = el
          else delete itemRefs.current[item.path]
        }}
        onClick={() => {
          if (window.innerWidth < 1024 && onClose) onClose()
        }}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm relative",
          inSection ? "font-semibold" : "",
          isActive(item.path)
            ? "bg-white text-neutral-950 shadow-md shadow-black/10 font-semibold"
            : "text-white/90 hover:bg-white/10 hover:text-white",
          isCollapsed && "justify-center px-2"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className={cn("w-4 h-4 shrink-0", isActive(item.path) ? "text-neutral-950 scale-110" : "text-white/85")} />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </Link>
    )
  }

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-neutral-900 h-screen fixed left-0 top-0 z-50 flex flex-col overflow-hidden",
        "transform transition-all duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      <div className="shrink-0 px-3 py-3 border-b border-neutral-800 bg-black/20">
        <div className="flex items-center justify-between mb-3">
          {!isCollapsed ? (
            <Link to={homePath} className="flex items-center gap-2 px-1">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-bold text-white shrink-0">A</div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">Ashwa India</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">{brand}</p>
              </div>
            </Link>
          ) : (
            <Link to={homePath} className="w-full flex items-center justify-center">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-bold text-white">A</div>
            </Link>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleCollapse}
              className="text-white/80 hover:text-white transition-all p-1.5 rounded-lg hover:bg-white/10"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="lg:hidden text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 py-2 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/40"
            />
          </div>
        )}
      </div>

      <nav className="sidebar-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-2">
        {filteredMenu.length === 0 && searchQuery.trim() ? (
          <div className="px-3 py-10 text-sm text-white/50">No menu items found</div>
        ) : (
          filteredMenu.map((item, index) => {
            if (item.type === "link") return renderLink(item, index)
            if (item.type === "section") {
              return (
                <div key={index} className={index > 0 ? "mt-4 pt-4 border-t border-white/10" : ""}>
                  {!isCollapsed && (
                    <div className="px-3 py-1.5 mb-1">
                      <span className="text-white/50 font-bold text-[11px] uppercase tracking-wider">{item.label}</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    {item.items.map((sub, subIndex) => renderLink(sub, `${index}-${subIndex}`, true))}
                  </div>
                </div>
              )
            }
            return null
          })
        )}
      </nav>
    </div>
  )
}
