import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useLocation } from "react-router-dom"
import { getSession, setSession, clearSession, apiFetch } from "@/shared/lib/api"
import { getRoleForPath } from "@/shared/constants/sidebarMenus"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const location = useLocation()
  const role = getRoleForPath(location.pathname)

  const [session, setSessionState] = useState(() => getSession(role))
  const [loading, setLoading] = useState(false)

  // Re-read this role's session whenever we navigate into a different role's
  // section of the app — each role has its own storage namespace.
  useEffect(() => {
    setSessionState(getSession(role))
  }, [role])

  useEffect(() => {
    const handleExpired = (e) => {
      if (e.detail?.role === role) {
        setSessionState({ role, accessToken: null, refreshToken: null, user: null })
      }
    }
    window.addEventListener("ashwa-session-expired", handleExpired)
    return () => window.removeEventListener("ashwa-session-expired", handleExpired)
  }, [role])

  const login = useCallback((data) => {
    const accountRole = data.user.role
    setSession(accountRole, { accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user })
    // Only update this provider's visible state if we're already in that role's section
    // (we always are right after a login redirect, since login happens on that role's login page).
    setSessionState({ role: accountRole, accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user })
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" })
    } catch (e) { /* ignore */ }
    clearSession(role)
    setSessionState({ role, accessToken: null, refreshToken: null, user: null })
  }, [role])

  const value = {
    user: session.user,
    role: session.accessToken ? session.role : null,
    isAuthenticated: Boolean(session.accessToken && session.user),
    loading,
    setLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
