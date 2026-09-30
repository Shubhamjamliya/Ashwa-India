import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/shared/context/AuthContext"

const loginPathForRole = {
  admin: "/admin/login",
  "horse-seller": "/seller/login?type=horse-seller",
  "store-seller": "/seller/login?type=store-seller",
}

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, role: currentRole } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || currentRole !== role) {
    const loginPath = loginPathForRole[role] || "/"
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  return children
}
