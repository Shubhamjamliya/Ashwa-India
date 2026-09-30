import { Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import PlaceholderPage from "@/shared/components/PlaceholderPage"

const placeholderRoutes = [
  ["products", "Products"],
  ["inventory", "Inventory"],
  ["orders", "Orders"],
  ["returns", "Returns"],
  ["payments", "Payments"],
  ["reviews", "Reviews"],
  ["profile", "Profile"],
]

export const storeSellerRoutes = (
  <>
    <Route index element={<Dashboard />} />
    {placeholderRoutes.map(([path, title]) => (
      <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
    ))}
  </>
)
