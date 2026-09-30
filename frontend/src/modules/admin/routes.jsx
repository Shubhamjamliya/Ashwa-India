import { Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import PlaceholderPage from "@/shared/components/PlaceholderPage"

import BusinessSetup from "./pages/system/BusinessSetup"
import CustomizationSettings from "./pages/system/CustomizationSettings"
import ArchivedAccounts from "./pages/system/ArchivedAccounts"
import SubAdmins from "./pages/system/SubAdmins"
import NotificationBroadcast from "./pages/system/NotificationBroadcast"

import AboutUs from "./pages/pages-social-media/AboutUs"
import ContactInfo from "./pages/pages-social-media/ContactInfo"
import TermsAndConditions from "./pages/pages-social-media/TermsAndConditions"
import PrivacyPolicy from "./pages/pages-social-media/PrivacyPolicy"
import Support from "./pages/pages-social-media/Support"
import RefundPolicy from "./pages/pages-social-media/RefundPolicy"
import ShippingPolicy from "./pages/pages-social-media/ShippingPolicy"
import CancellationPolicy from "./pages/pages-social-media/CancellationPolicy"

const placeholderRoutes = [
  ["users", "Users"],
  ["providers", "Service Providers"],
  ["transporters", "Transporters"],
  ["horses/listings", "Horse Listings"],
  ["horses/sellers", "Horse Sellers"],
  ["horses/inquiries", "Inquiries"],
  ["store/products", "Products"],
  ["store/sellers", "Store Sellers"],
  ["store/orders", "Orders"],
  ["transport/requests", "Transport Requests"],
  ["transport/shared", "Shared Rides"],
  ["transport/tracking", "Live Tracking"],
  ["bookings", "Bookings"],
  ["payments", "Payments"],
  ["commission", "Commission"],
  ["reviews", "Reviews"],
  ["notifications", "Notifications"],
  ["support", "Support Tickets"],
  ["profile", "Admin Profile"],
]

export const adminRoutes = (
  <>
    <Route index element={<Dashboard />} />

    {/* System Settings */}
    <Route path="system/broadcast-notification" element={<NotificationBroadcast />} />
    <Route path="system/sub-admins" element={<SubAdmins />} />
    <Route path="system/business-setup" element={<BusinessSetup />} />
    <Route path="system/customization" element={<CustomizationSettings />} />
    <Route path="system/archived-accounts" element={<ArchivedAccounts />} />

    {/* Pages & Social Media */}
    <Route path="pages/about" element={<AboutUs />} />
    <Route path="pages/contact" element={<ContactInfo />} />
    <Route path="pages/terms" element={<TermsAndConditions />} />
    <Route path="pages/privacy" element={<PrivacyPolicy />} />
    <Route path="pages/support" element={<Support />} />
    <Route path="pages/refund" element={<RefundPolicy />} />
    <Route path="pages/shipping" element={<ShippingPolicy />} />
    <Route path="pages/cancellation" element={<CancellationPolicy />} />

    {placeholderRoutes.map(([path, title]) => (
      <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
    ))}
  </>
)
