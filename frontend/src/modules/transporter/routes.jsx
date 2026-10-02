import { Route } from "react-router-dom"
import IncomingRequests from "./pages/IncomingRequests"

export const transporterRoutes = (
  <>
    <Route index element={<IncomingRequests />} />
  </>
)
