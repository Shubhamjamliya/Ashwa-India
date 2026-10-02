import { Outlet } from "react-router-dom"
import BottomTabBar from "./BottomTabBar"

// Mirrors the native UserApp shell: no top nav bar, a phone-width content
// column, and a floating bottom tab bar (see CustomTabBar.tsx in Apps/UserApp).
export default function UserAppLayout() {
  return (
    <div className="min-h-screen bg-[#FAF7F1]">
      <div className="mx-auto min-h-screen w-full max-w-[480px] bg-[#FAF7F1] pb-28 shadow-xl">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  )
}
