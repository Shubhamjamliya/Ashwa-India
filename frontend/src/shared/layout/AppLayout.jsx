import { useState, useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import AppSidebar from "@/shared/layout/AppSidebar"
import AppNavbar from "@/shared/layout/AppNavbar"
import { roles, sidebarMenus, getRoleForPath } from "@/shared/constants/sidebarMenus"

export default function AppLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const role = getRoleForPath(location.pathname)
  const roleInfo = roles[role]
  const menu = sidebarMenus[role]

  useEffect(() => {
    try {
      const saved = localStorage.getItem("app_sidebar_state")
      if (saved) {
        const state = JSON.parse(saved)
        if (typeof state?.isCollapsed !== "undefined") setIsSidebarCollapsed(state.isCollapsed)
      }
    } catch (e) { /* ignore */ }
  }, [])

  return (
    <div className="h-screen bg-neutral-100 flex overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <AppSidebar
        menu={menu}
        brand={roleInfo.brand}
        homePath={roleInfo.homePath}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCollapseChange={setIsSidebarCollapsed}
      />

      <div
        className={`flex-1 flex min-h-0 flex-col transition-all duration-300 ease-in-out min-w-0 ${
          isSidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        }`}
      >
        <AppNavbar onMenuClick={() => setSidebarOpen((prev) => !prev)} role={role} />
        <main className="flex-1 min-h-0 w-full max-w-full overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
