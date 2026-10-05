import { Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Bookings from "./pages/Bookings"
import Wallet from "./pages/Wallet"
import Profile from "./pages/Profile"
import EditProfile from "./pages/EditProfile"
import Notifications from "./pages/Notifications"
import Earnings from "./pages/Earnings"
import Reviews from "./pages/Reviews"
import HelpSupport from "./pages/HelpSupport"
import About from "./pages/About"
import Settings from "./pages/Settings"
import JobsBrowser from "@/shared/jobs/JobsBrowser"
import JobDetail from "@/shared/jobs/JobDetail"
import PostJob from "@/shared/jobs/PostJob"
import ManageJob from "@/shared/jobs/ManageJob"

export const serviceRoutes = (
  <>
    <Route index element={<Dashboard />} />
    <Route path="bookings" element={<Bookings />} />
    <Route path="wallet" element={<Wallet />} />
    <Route path="profile" element={<Profile />} />
    <Route path="profile/edit" element={<EditProfile />} />
    <Route path="notifications" element={<Notifications />} />
    <Route path="earnings" element={<Earnings />} />
    <Route path="reviews" element={<Reviews />} />
    <Route path="help" element={<HelpSupport />} />
    <Route path="about" element={<About />} />
    <Route path="settings" element={<Settings />} />
    <Route path="jobs" element={<JobsBrowser basePath="/service/jobs" />} />
    <Route path="jobs/new" element={<PostJob basePath="/service/jobs" />} />
    <Route path="jobs/:id" element={<JobDetail />} />
    <Route path="jobs/:id/manage" element={<ManageJob />} />
  </>
)
