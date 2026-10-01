import { Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Categories from "./pages/Categories"
import Products from "./pages/Products"
import Orders from "./pages/Orders"
import PlaceholderPage from "@/shared/components/PlaceholderPage"

const placeholderRoutes = [
  ["inventory", "Inventory"],
  ["returns", "Returns"],
  ["payments", "Payments"],
  ["reviews", "Reviews"],
  ["profile", "Profile"],
]

export const storeSellerRoutes = (
  <>
    <Route index element={<Dashboard />} />
    <Route path="categories" element={<Categories />} />
    <Route path="products" element={<Products />} />
    <Route path="orders" element={<Orders />} />
    {placeholderRoutes.map(([path, title]) => (
      <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
    ))}
  </>
)
