import { Outlet, useLocation } from "react-router-dom"
import BottomTabBar from "./BottomTabBar"

// Chat screens take the full height, so the bottom tab bar is hidden while a conversation is open.
const CHAT_ROUTE = /^\/user\/inquiries\/[^/]+$/

// Mirrors the native UserApp shell: no top nav bar, a phone-width content
// column, and a floating bottom tab bar (see CustomTabBar.tsx in Apps/UserApp).
export default function UserAppLayout() {
  const { pathname } = useLocation()
  const inChat = CHAT_ROUTE.test(pathname)

  return (
    <div className="min-h-screen bg-[#FAF7F1]">
      <div className={`mx-auto min-h-screen w-full max-w-[480px] bg-[#FAF7F1] shadow-xl ${inChat ? "" : "pb-28"}`}>
        <Outlet />
      </div>
      {!inChat && <BottomTabBar />}
    </div>
  )
}
