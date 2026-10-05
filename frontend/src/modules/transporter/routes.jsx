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
import Vehicles from "./pages/Vehicles"
import Drivers from "./pages/Drivers"
import Kyc from "./pages/Kyc"
import Withdrawals from "./pages/Withdrawals"
import Reviews from "./pages/Reviews"

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
    <Route path="vehicles" element={<Vehicles />} />
    <Route path="drivers" element={<Drivers />} />
    <Route path="kyc" element={<Kyc />} />
    <Route path="withdrawals" element={<Withdrawals />} />
    <Route path="reviews" element={<Reviews />} />
  </>
)
