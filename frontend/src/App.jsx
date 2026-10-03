import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/shared/context/AuthContext"
import { BrandingProvider } from "@/shared/context/BrandingContext"
import ProtectedRoute from "@/shared/components/ProtectedRoute"
import AppLayout from "@/shared/layout/AppLayout"
import ConsumerLayout from "@/shared/layout/ConsumerLayout"
import UserAppLayout from "@/modules/user/layout/UserAppLayout"
import TransporterAppLayout from "@/modules/transporter/layout/TransporterAppLayout"
import ServiceAppLayout from "@/modules/service/layout/ServiceAppLayout"
import { adminRoutes } from "@/modules/admin/routes"
import { horseSellerRoutes } from "@/modules/horseSeller/routes"
import { storeSellerRoutes } from "@/modules/storeSeller/routes"
import { userRoutes } from "@/modules/user/routes"
import { transporterRoutes } from "@/modules/transporter/routes"
import { serviceRoutes } from "@/modules/service/routes"
import SellerLogin from "@/modules/sellerAuth/pages/SellerLogin"
import AdminLogin from "@/modules/adminAuth/pages/AdminLogin"
import UserLogin from "@/modules/user/pages/UserLogin"
import TransporterLogin from "@/modules/transporter/pages/TransporterLogin"
import ServiceLogin from "@/modules/service/pages/ServiceLogin"
import { CartProvider } from "@/modules/user/context/CartContext"
import { WishlistProvider } from "@/modules/user/context/WishlistContext"
import { AddressProvider } from "@/modules/user/context/AddressContext"

function App() {
  return (
    <BrowserRouter>
      <BrandingProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/seller/login" element={<SellerLogin />} />
            <Route path="/user/login" element={<UserLogin />} />
            <Route path="/transporter/login" element={<TransporterLogin />} />
            <Route path="/service/login" element={<ServiceLogin />} />

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

            <Route
              path="/user"
              element={
                <ProtectedRoute role="user">
                  <CartProvider>
                    <WishlistProvider>
                      <AddressProvider>
                        <UserAppLayout />
                      </AddressProvider>
                    </WishlistProvider>
                  </CartProvider>
                </ProtectedRoute>
              }
            >
              {userRoutes}
            </Route>

            <Route
              path="/transporter"
              element={
                <ProtectedRoute role="transporter">
                  <TransporterAppLayout />
                </ProtectedRoute>
              }
            >
              {transporterRoutes}
            </Route>

            <Route
              path="/service"
              element={
                <ProtectedRoute role="provider">
                  <ServiceAppLayout />
                </ProtectedRoute>
              }
            >
              {serviceRoutes}
            </Route>
          </Routes>
        </AuthProvider>
      </BrandingProvider>
    </BrowserRouter>
  )
}

export default App
