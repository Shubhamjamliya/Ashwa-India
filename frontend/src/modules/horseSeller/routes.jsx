import { Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import PlaceholderPage from "@/shared/components/PlaceholderPage"

const placeholderRoutes = [
  ["listings", "My Horses"],
  ["add", "Add Horse"],
  ["inquiries", "Inquiries"],
  ["orders", "Orders"],
  ["payments", "Payments"],
  ["reviews", "Reviews"],
  ["profile", "Profile"],
]

export const horseSellerRoutes = (
  <>
    <Route index element={<Dashboard />} />
    {placeholderRoutes.map(([path, title]) => (
      <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
    ))}
  </>
)
