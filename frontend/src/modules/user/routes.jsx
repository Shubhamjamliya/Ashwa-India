import { Route } from "react-router-dom"
import Home from "./pages/Home"
import Marketplace from "./pages/Marketplace"
import HorseDetail from "./pages/HorseDetail"
import Store from "./pages/Store"
import ProductDetail from "./pages/ProductDetail"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import Orders from "./pages/Orders"
import Wallet from "./pages/Wallet"
import OrderDetail from "./pages/OrderDetail"
import Profile from "./pages/Profile"
import Bookings from "./pages/Bookings"
import Events from "./pages/Events"
import Services from "./pages/Services"
import Inquiries from "./pages/Inquiries"
import ServiceProviders from "./pages/ServiceProviders"
import ProviderProfile from "./pages/ProviderProfile"
import Transport from "./pages/Transport"
import TransportResults from "./pages/TransportResults"
import EditProfile from "./pages/EditProfile"
import SavedAddresses from "./pages/SavedAddresses"
import SelectAddress from "./pages/SelectAddress"
import AddressForm from "./pages/AddressForm"
import HelpSupport from "./pages/HelpSupport"
import About from "./pages/About"
import Settings from "./pages/Settings"
import Wishlist from "./pages/Wishlist"
import Notifications from "./pages/Notifications"
import ChangeLocation from "./pages/ChangeLocation"

export const userRoutes = (
  <>
    <Route index element={<Home />} />
    <Route path="horses" element={<Marketplace />} />
    <Route path="horses/:id" element={<HorseDetail />} />
    <Route path="store" element={<Store />} />
    <Route path="store/:id" element={<ProductDetail />} />
    <Route path="cart" element={<Cart />} />
    <Route path="checkout" element={<Checkout />} />
    <Route path="transport" element={<Transport />} />
    <Route path="transport/results" element={<TransportResults />} />
    <Route path="bookings" element={<Bookings />} />
    <Route path="events" element={<Events />} />
    <Route path="inquiries" element={<Inquiries />} />
    <Route path="services" element={<Services />} />
    <Route path="services/:key" element={<ServiceProviders />} />
    <Route path="services/:key/providers/:id" element={<ProviderProfile />} />
    <Route path="orders" element={<Orders />} />
    <Route path="wallet" element={<Wallet />} />
    <Route path="orders/:id" element={<OrderDetail />} />
    <Route path="profile" element={<Profile />} />
    <Route path="profile/edit" element={<EditProfile />} />
    <Route path="addresses" element={<SavedAddresses />} />
    <Route path="addresses/select" element={<SelectAddress />} />
    <Route path="addresses/new" element={<AddressForm />} />
    <Route path="addresses/:editId/edit" element={<AddressForm />} />
    <Route path="wishlist" element={<Wishlist />} />
    <Route path="notifications" element={<Notifications />} />
    <Route path="change-location" element={<ChangeLocation />} />
    <Route path="help" element={<HelpSupport />} />
    <Route path="about" element={<About />} />
    <Route path="settings" element={<Settings />} />
  </>
)
