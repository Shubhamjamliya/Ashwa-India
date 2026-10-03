import { Route } from "react-router-dom"
import IncomingRequests from "./pages/IncomingRequests"
import Bookings from "./pages/Bookings"
import Wallet from "./pages/Wallet"
import Profile from "./pages/Profile"
import EditProfile from "./pages/EditProfile"
import Notifications from "./pages/Notifications"
import Job from "./pages/Job"
import Earnings from "./pages/Earnings"
import HelpSupport from "./pages/HelpSupport"
import About from "./pages/About"
import Settings from "./pages/Settings"

export const transporterRoutes = (
  <>
    <Route index element={<IncomingRequests />} />
    <Route path="bookings" element={<Bookings />} />
    <Route path="wallet" element={<Wallet />} />
    <Route path="profile" element={<Profile />} />
    <Route path="profile/edit" element={<EditProfile />} />
    <Route path="notifications" element={<Notifications />} />
    <Route path="jobs/:id" element={<Job />} />
    <Route path="earnings" element={<Earnings />} />
    <Route path="help" element={<HelpSupport />} />
    <Route path="about" element={<About />} />
    <Route path="settings" element={<Settings />} />
  </>
)
