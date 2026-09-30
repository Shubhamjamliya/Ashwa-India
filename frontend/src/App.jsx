import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import AppLayout from "@/shared/layout/AppLayout"
import { adminRoutes } from "@/modules/admin/routes"
import { horseSellerRoutes } from "@/modules/horseSeller/routes"
import { storeSellerRoutes } from "@/modules/storeSeller/routes"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        <Route path="/admin" element={<AppLayout />}>
          {adminRoutes}
        </Route>

        <Route path="/seller/horses" element={<AppLayout />}>
          {horseSellerRoutes}
        </Route>

        <Route path="/seller/store" element={<AppLayout />}>
          {storeSellerRoutes}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
