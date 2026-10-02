import { Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"

export const serviceRoutes = (
  <>
    <Route index element={<Dashboard />} />
  </>
)
