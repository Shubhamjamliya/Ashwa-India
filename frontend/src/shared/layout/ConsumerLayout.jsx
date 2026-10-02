import { useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { LogOut, Menu, X } from "lucide-react"
import { useAuth } from "@/shared/context/AuthContext"

// Lightweight header+content shell for the consumer/vendor-facing web apps
// (/user, /transporter, /service) — distinct from AppLayout's admin sidebar,
// since these are storefront/portal pages, not back-office dashboards.
export default function ConsumerLayout({ brand, navItems = [], homePath }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate(homePath.replace(/\/[^/]*$/, "/login"))
  }

  return (
    <div className="min-h-screen bg-[#FAF7F1]">
      <header className="sticky top-0 z-30 bg-[#0B1C33] text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(homePath)}
            className="text-lg font-extrabold tracking-tight"
          >
            {brand}
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-[#A9B8CC] hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </button>
            ))}
            <div className="ml-3 flex items-center gap-3 border-l border-white/10 pl-3">
              <span className="text-sm text-[#A9B8CC]">{user?.name || user?.phone}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </nav>

          <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 px-4 py-3 md:hidden">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setMenuOpen(false)
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#A9B8CC] hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </button>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
              <span className="text-sm text-[#A9B8CC]">{user?.name || user?.phone}</span>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-semibold text-rose-300">
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
