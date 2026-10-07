import { Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Categories from "./pages/Categories"
import Listings from "./pages/Listings"
import AddHorse from "./pages/AddHorse"
import Inquiries from "./pages/Inquiries"
import Profile from "./pages/Profile"
import PlaceholderPage from "@/shared/components/PlaceholderPage"

const placeholderRoutes = [
  ["orders", "Orders"],
  ["payments", "Payments"],
  ["reviews", "Reviews"],
]

export const horseSellerRoutes = (
  <>
    <Route index element={<Dashboard />} />
    <Route path="categories" element={<Categories />} />
    <Route path="listings" element={<Listings />} />
    <Route path="add" element={<AddHorse />} />
    <Route path="inquiries" element={<Inquiries />} />
    <Route path="profile" element={<Profile />} />
    {placeholderRoutes.map(([path, title]) => (
      <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
    ))}
  </>
)
