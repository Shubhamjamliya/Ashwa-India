import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/shared/context/AuthContext"
import { BrandingProvider } from "@/shared/context/BrandingContext"
import ProtectedRoute from "@/shared/components/ProtectedRoute"
import AppLayout from "@/shared/layout/AppLayout"
import { adminRoutes } from "@/modules/admin/routes"
import { horseSellerRoutes } from "@/modules/horseSeller/routes"
import { storeSellerRoutes } from "@/modules/storeSeller/routes"
import SellerLogin from "@/modules/sellerAuth/pages/SellerLogin"
import AdminLogin from "@/modules/adminAuth/pages/AdminLogin"

function App() {
  return (
    <BrowserRouter>
      <BrandingProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/seller/login" element={<SellerLogin />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {adminRoutes}
            </Route>

            <Route
              path="/seller/horses"
              element={
                <ProtectedRoute role="horse-seller">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {horseSellerRoutes}
            </Route>

            <Route
              path="/seller/store"
              element={
                <ProtectedRoute role="store-seller">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {storeSellerRoutes}
            </Route>
          </Routes>
        </AuthProvider>
      </BrandingProvider>
    </BrowserRouter>
  )
}

export default App
