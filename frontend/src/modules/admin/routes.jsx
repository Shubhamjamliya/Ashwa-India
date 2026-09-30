import { Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import PlaceholderPage from "@/shared/components/PlaceholderPage"

const placeholderRoutes = [
  ["users", "Users"],
  ["providers", "Service Providers"],
  ["transporters", "Transporters"],
  ["horses/listings", "Horse Listings"],
  ["horses/sellers", "Horse Sellers"],
  ["horses/inquiries", "Inquiries"],
  ["store/products", "Products"],
  ["store/sellers", "Store Sellers"],
  ["store/orders", "Orders"],
  ["transport/requests", "Transport Requests"],
  ["transport/shared", "Shared Rides"],
  ["transport/tracking", "Live Tracking"],
  ["bookings", "Bookings"],
  ["payments", "Payments"],
  ["commission", "Commission"],
  ["reviews", "Reviews"],
  ["notifications", "Notifications"],
  ["support", "Support Tickets"],
  ["settings", "General Settings"],
  ["profile", "Admin Profile"],
]

export const adminRoutes = (
  <>
    <Route index element={<Dashboard />} />
    {placeholderRoutes.map(([path, title]) => (
      <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
    ))}
  </>
)
