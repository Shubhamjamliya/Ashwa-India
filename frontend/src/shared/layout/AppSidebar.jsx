import { useState, useEffect, useMemo, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Search, LayoutDashboard, Users, UserCog, Truck, Heart, Store, MessageSquare,
  Package, Building2, ShoppingBag, FileText, Route, MapPin, Calendar, CreditCard,
  DollarSign, Star, Bell, Headset, Settings, User, ChevronDown, ChevronRight,
  ChevronLeft, X, Zap, UserX, Globe, Phone, Lock, Receipt, Code, FolderTree,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/components/ui/input"
import { useBranding } from "@/shared/context/BrandingContext"

const iconMap = {
  LayoutDashboard, Users, UserCog, Truck, Heart, Store, MessageSquare, Package,
  Building2, ShoppingBag, FileText, Route, MapPin, Calendar, CreditCard,
  DollarSign, Star, Bell, Headset, Settings, User, Zap, UserX, Globe, Phone, Lock, Receipt, X, Code, FolderTree,
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
  const { logoUrl, companyName } = useBranding()

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
  }, [searchQuery, menu])

  const renderLink = (item, key, index, inSection = false) => {
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
          "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 ease-out menu-item-animate text-sm relative",
          inSection ? "font-semibold" : "",
          isActive(item.path)
            ? "bg-white text-neutral-950 shadow-md shadow-black/10 font-semibold"
            : "text-white/90 hover:bg-white/10 hover:text-white",
          isCollapsed && "justify-center px-2"
        )}
        style={{ animationDelay: `${index * 0.04}s` }}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className={cn(
          "w-4 h-4 shrink-0 transition-all duration-300",
          isActive(item.path) ? "text-neutral-950 scale-110" : "text-white/85"
        )} />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </Link>
    )
  }

  return (
    <>
      <style>{`
        @keyframes ashwaSlideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes ashwaFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .menu-item-animate {
          animation: ashwaSlideIn 0.3s ease-out forwards;
        }
        .section-fade-in {
          animation: ashwaFadeIn 0.4s ease-out forwards;
        }
      `}</style>
      <div
        className={cn(
          "bg-sidebar border-r border-neutral-900 h-screen fixed left-0 top-0 z-50 flex flex-col overflow-hidden",
          "transform transition-all duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-20" : "w-80"
        )}
      >
        <div className="shrink-0 px-3 py-3 border-b border-neutral-800 bg-black/20 animate-[ashwaFadeIn_0.4s_ease-out]">
          <div className="flex items-center justify-between mb-3">
            {!isCollapsed ? (
              <Link to={homePath} className="flex items-center gap-2 px-1 animate-[ashwaSlideIn_0.3s_ease-out] min-w-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={companyName || "Ashwa India"}
                    className="h-9 max-w-[9.5rem] object-contain shrink-0"
                    onError={(e) => { e.currentTarget.style.display = "none" }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-bold text-white shrink-0">A</div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white leading-tight truncate">{companyName || "Ashwa India"}</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">{brand}</p>
                </div>
              </Link>
            ) : (
              <Link to={homePath} className="w-full flex items-center justify-center">
                {logoUrl ? (
                  <img src={logoUrl} alt={companyName || "Ashwa India"} className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-bold text-white">A</div>
                )}
              </Link>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleCollapse}
                className="text-white/80 hover:text-white transition-all duration-200 hover:scale-110 p-1.5 rounded-lg hover:bg-white/10"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button onClick={onClose} className="lg:hidden text-white/80 hover:text-white transition-all duration-200 hover:scale-110">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isCollapsed && (
            <div className="relative animate-[ashwaSlideIn_0.4s_ease-out_0.1s_both]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4 z-10" />
              <Input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/40 transition-all duration-200",
                  searchQuery ? "pr-9" : "pr-3"
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-all duration-200 hover:scale-110 z-10"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <nav className="sidebar-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-2">
          {filteredMenu.length === 0 && searchQuery.trim() ? (
            <div className="px-3 py-10 text-center section-fade-in">
              <p className="text-white/60 text-sm font-medium">No menu items found</p>
              <p className="text-white/40 text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            filteredMenu.map((item, index) => {
              if (item.type === "link") return renderLink(item, index, index)
              if (item.type === "section") {
                return (
                  <div
                    key={index}
                    className={cn(index > 0 ? "mt-4" : "", "section-fade-in")}
                    style={{ animationDelay: `${index * 0.06}s` }}
                  >
                    {!isCollapsed && (
                      <div className="px-3 py-1.5 mb-1">
                        <span className="text-white/60 font-bold text-sm uppercase tracking-wider">{item.label}</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      {item.items.map((sub, subIndex) => renderLink(sub, `${index}-${subIndex}`, subIndex, true))}
                    </div>
                  </div>
                )
              }
              return null
            })
          )}
        </nav>
      </div>
    </>
  )
}
