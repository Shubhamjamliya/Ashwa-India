import { Route } from "react-router-dom"
import Home from "./pages/Home"
import Marketplace from "./pages/Marketplace"
import HorseDetail from "./pages/HorseDetail"
import Store from "./pages/Store"
import ProductDetail from "./pages/ProductDetail"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import Orders from "./pages/Orders"
import Profile from "./pages/Profile"
import Bookings from "./pages/Bookings"
import EditProfile from "./pages/EditProfile"
import { SavedAddresses, AddressForm } from "./pages/SavedAddresses"
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
    <Route path="bookings" element={<Bookings />} />
    <Route path="orders" element={<Orders />} />
    <Route path="profile" element={<Profile />} />
    <Route path="profile/edit" element={<EditProfile />} />
    <Route path="addresses" element={<SavedAddresses />} />
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
