import { Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Profile from "./pages/Profile"
import PlaceholderPage from "@/shared/components/PlaceholderPage"

import HorseSellers from "./pages/horses/Sellers"
import HorseListings from "./pages/horses/Listings"
import HorseCategories from "./pages/horses/Categories"
import StoreSellers from "./pages/store/Sellers"
import StoreProducts from "./pages/store/Products"
import StoreOrders from "./pages/store/Orders"
import StoreCategories from "./pages/store/Categories"
import UsersList from "./pages/users/List"
import Banners from "./pages/userApp/Banners"
import ProvidersList from "./pages/providers/List"
import TransportersList from "./pages/transporters/List"
import TransportRequests from "./pages/transport/Requests"
import RolePage from "./pages/commission/RolePage"

import BusinessSetup from "./pages/system/BusinessSetup"
import ZoneSetup from "./pages/system/zones/ZoneSetup"
import AddZone from "./pages/system/zones/AddZone"
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

import DeveloperSettings from "./pages/developer/Settings"

const placeholderRoutes = [
  ["horses/inquiries", "Inquiries"],
  ["transport/shared", "Shared Rides"],
  ["transport/tracking", "Live Tracking"],
  ["bookings", "Bookings"],
  ["payments", "Payments"],
  ["reviews", "Reviews"],
  ["notifications", "Notifications"],
  ["support", "Support Tickets"],
]

export const adminRoutes = (
  <>
    <Route index element={<Dashboard />} />

    <Route path="user-app/banners" element={<Banners />} />
    <Route path="users" element={<UsersList />} />
    <Route path="providers" element={<ProvidersList />} />
    <Route path="transporters" element={<TransportersList />} />
    <Route path="transport/requests" element={<TransportRequests />} />
    <Route path="commission/transporter" element={<RolePage role="transporter" />} />
    <Route path="commission/provider" element={<RolePage role="provider" />} />
    <Route path="horses/sellers" element={<HorseSellers />} />
    <Route path="horses/listings" element={<HorseListings />} />
    <Route path="horses/categories" element={<HorseCategories />} />
    <Route path="store/categories" element={<StoreCategories />} />
    <Route path="store/sellers" element={<StoreSellers />} />
    <Route path="store/products" element={<StoreProducts />} />
    <Route path="store/orders" element={<StoreOrders />} />

    {/* System Settings */}
    <Route path="system/broadcast-notification" element={<NotificationBroadcast />} />
    <Route path="system/sub-admins" element={<SubAdmins />} />
    <Route path="system/business-setup" element={<BusinessSetup />} />
    <Route path="system/zones" element={<ZoneSetup />} />
    <Route path="system/zones/add" element={<AddZone />} />
    <Route path="system/zones/edit/:id" element={<AddZone />} />
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

    {/* Developer Settings */}
    <Route path="developer/settings" element={<DeveloperSettings />} />

    <Route path="profile" element={<Profile />} />

    {placeholderRoutes.map(([path, title]) => (
      <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
    ))}
  </>
)
