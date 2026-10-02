import { Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Categories from "./pages/Categories"
import Products from "./pages/Products"
import Orders from "./pages/Orders"
import Profile from "./pages/Profile"
import Reviews from "./pages/Reviews"
import Payments from "./pages/Payments"
import PlaceholderPage from "@/shared/components/PlaceholderPage"

const placeholderRoutes = [
  ["inventory", "Inventory"],
  ["returns", "Returns"],
]

export const storeSellerRoutes = (
  <>
    <Route index element={<Dashboard />} />
    <Route path="categories" element={<Categories />} />
    <Route path="products" element={<Products />} />
    <Route path="orders" element={<Orders />} />
    <Route path="payments" element={<Payments />} />
    <Route path="reviews" element={<Reviews />} />
    <Route path="profile" element={<Profile />} />
    {placeholderRoutes.map(([path, title]) => (
      <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
    ))}
  </>
)
