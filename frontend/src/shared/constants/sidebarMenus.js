export const roles = {
  admin: { label: "Admin", homePath: "/admin", brand: "Admin Panel" },
  "horse-seller": { label: "Horse Seller", homePath: "/seller/horses", brand: "Horse Seller" },
  "store-seller": { label: "Store Seller", homePath: "/seller/store", brand: "Accessories Seller" },
  user: { label: "User", homePath: "/user", brand: "Ashwa India" },
  transporter: { label: "Transporter", homePath: "/transporter", brand: "Ashwa India Transporter" },
  provider: { label: "Service Provider", homePath: "/service", brand: "Ashwa India Services" },
}

export function getRoleForPath(pathname) {
  if (pathname.startsWith("/seller/horses")) return "horse-seller"
  if (pathname.startsWith("/seller/store")) return "store-seller"
  if (pathname.startsWith("/user")) return "user"
  if (pathname.startsWith("/transporter")) return "transporter"
  if (pathname.startsWith("/service")) return "provider"
  return "admin"
}

const adminMenu = [
  { type: "link", label: "Dashboard", icon: "LayoutDashboard", path: "/admin" },
  {
    type: "section",
    label: "Manage User App",
    items: [
      { type: "link", label: "Banners", icon: "Image", path: "/admin/user-app/banners" },
      { type: "link", label: "Explore", icon: "Compass", path: "/admin/user-app/explore" },
    ],
  },
  {
    type: "section",
    label: "Users",
    items: [
      { type: "link", label: "Users", icon: "Users", path: "/admin/users" },
    ],
  },
  {
    type: "section",
    label: "Service Providers",
    items: [
      { type: "link", label: "Service Providers", icon: "UserCog", path: "/admin/providers" },
      { type: "link", label: "Services", icon: "Wrench", path: "/admin/services" },
      { type: "link", label: "Commission", icon: "DollarSign", path: "/admin/commission/provider" },
    ],
  },
  {
    type: "section",
    label: "Horse Marketplace",
    items: [
      { type: "link", label: "Horse Category", icon: "FolderTree", path: "/admin/horses/categories" },
      { type: "link", label: "Horse Listings", icon: "Heart", path: "/admin/horses/listings" },
      { type: "link", label: "Horse Sellers", icon: "Store", path: "/admin/horses/sellers" },
      { type: "link", label: "Inquiries", icon: "MessageSquare", path: "/admin/horses/inquiries" },
    ],
  },
  {
    type: "section",
    label: "Accessories Store",
    items: [
      { type: "link", label: "Product Categories", icon: "FolderTree", path: "/admin/store/categories" },
      { type: "link", label: "Products", icon: "Package", path: "/admin/store/products" },
      { type: "link", label: "Store Sellers", icon: "Building2", path: "/admin/store/sellers" },
      { type: "link", label: "Orders", icon: "ShoppingBag", path: "/admin/store/orders" },
      { type: "link", label: "Coupons & Payments", icon: "Ticket", path: "/admin/store/coupons" },
      { type: "link", label: "Commission", icon: "DollarSign", path: "/admin/commission/store" },
    ],
  },
  {
    type: "section",
    label: "Transport",
    items: [
      { type: "link", label: "Transporters", icon: "Truck", path: "/admin/transporters" },
      { type: "link", label: "Transport Requests", icon: "FileText", path: "/admin/transport/requests" },
      { type: "link", label: "Shared Rides", icon: "Route", path: "/admin/transport/shared" },
      { type: "link", label: "Live Tracking", icon: "MapPin", path: "/admin/transport/tracking" },
      { type: "link", label: "Commission", icon: "DollarSign", path: "/admin/commission/transporter" },
    ],
  },
  {
    type: "section",
    label: "Events",
    items: [
      { type: "link", label: "Events", icon: "CalendarDays", path: "/admin/events" },
    ],
  },
  {
    type: "section",
    label: "Bookings & Finance",
    items: [
      { type: "link", label: "Bookings", icon: "Calendar", path: "/admin/bookings" },
      { type: "link", label: "Payments", icon: "CreditCard", path: "/admin/payments" },
    ],
  },
  {
    type: "section",
    label: "Engagement",
    items: [
      { type: "link", label: "Reviews", icon: "Star", path: "/admin/reviews" },
      { type: "link", label: "Notifications", icon: "Bell", path: "/admin/notifications" },
      { type: "link", label: "Support Tickets", icon: "Headset", path: "/admin/support" },
    ],
  },
  {
    type: "section",
    label: "System Settings",
    items: [
      { type: "link", label: "Broadcast Notification", icon: "Bell", path: "/admin/system/broadcast-notification" },
      { type: "link", label: "Sub-Admins", icon: "UserCog", path: "/admin/system/sub-admins" },
      { type: "link", label: "Business Setup", icon: "Settings", path: "/admin/system/business-setup" },
      { type: "link", label: "Zone Setup", icon: "MapPin", path: "/admin/system/zones" },
      { type: "link", label: "Customization Settings", icon: "Zap", path: "/admin/system/customization" },
      { type: "link", label: "Archived Accounts", icon: "UserX", path: "/admin/system/archived-accounts" },
    ],
  },
  {
    type: "section",
    label: "Pages & Social Media",
    items: [
      { type: "link", label: "About Us", icon: "Globe", path: "/admin/pages/about" },
      { type: "link", label: "Landing Page Support", icon: "Phone", path: "/admin/pages/contact" },
      { type: "link", label: "Terms & Conditions", icon: "FileText", path: "/admin/pages/terms" },
      { type: "link", label: "Privacy Policy", icon: "Lock", path: "/admin/pages/privacy" },
      { type: "link", label: "Support", icon: "Headset", path: "/admin/pages/support" },
      { type: "link", label: "Refund Policy", icon: "Receipt", path: "/admin/pages/refund" },
      { type: "link", label: "Shipping Policy", icon: "Truck", path: "/admin/pages/shipping" },
      { type: "link", label: "Cancellation Policy", icon: "X", path: "/admin/pages/cancellation" },
    ],
  },
  {
    type: "section",
    label: "Developer Settings",
    items: [
      { type: "link", label: "Settings Page", icon: "Code", path: "/admin/developer/settings" },
    ],
  },
]

const horseSellerMenu = [
  { type: "link", label: "Dashboard", icon: "LayoutDashboard", path: "/seller/horses" },
  {
    type: "section",
    label: "Listings",
    items: [
      { type: "link", label: "Horse Category", icon: "FolderTree", path: "/seller/horses/categories" },
      { type: "link", label: "Horses", icon: "Heart", path: "/seller/horses/listings" },
    ],
  },
  {
    type: "section",
    label: "Sales",
    items: [
      { type: "link", label: "Inquiries", icon: "MessageSquare", path: "/seller/horses/inquiries" },
      { type: "link", label: "Orders", icon: "ShoppingBag", path: "/seller/horses/orders" },
      { type: "link", label: "Payments", icon: "CreditCard", path: "/seller/horses/payments" },
    ],
  },
  {
    type: "section",
    label: "Account",
    items: [
      { type: "link", label: "Reviews", icon: "Star", path: "/seller/horses/reviews" },
      { type: "link", label: "Profile", icon: "User", path: "/seller/horses/profile" },
    ],
  },
]

const storeSellerMenu = [
  { type: "link", label: "Dashboard", icon: "LayoutDashboard", path: "/seller/store" },
  {
    type: "section",
    label: "Catalog",
    items: [
      { type: "link", label: "Product Categories", icon: "FolderTree", path: "/seller/store/categories" },
      { type: "link", label: "Products", icon: "Package", path: "/seller/store/products" },
      { type: "link", label: "Inventory", icon: "Building2", path: "/seller/store/inventory" },
    ],
  },
  {
    type: "section",
    label: "Sales",
    items: [
      { type: "link", label: "Orders", icon: "ShoppingBag", path: "/seller/store/orders" },
      { type: "link", label: "Returns", icon: "FileText", path: "/seller/store/returns" },
      { type: "link", label: "Payments", icon: "CreditCard", path: "/seller/store/payments" },
      { type: "link", label: "Earnings", icon: "Wallet", path: "/seller/store/earnings" },
    ],
  },
  {
    type: "section",
    label: "Account",
    items: [
      { type: "link", label: "Reviews", icon: "Star", path: "/seller/store/reviews" },
      { type: "link", label: "Profile", icon: "User", path: "/seller/store/profile" },
    ],
  },
]

export const sidebarMenus = {
  admin: adminMenu,
  "horse-seller": horseSellerMenu,
  "store-seller": storeSellerMenu,
}
