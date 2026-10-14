import { Outlet } from "react-router-dom"
import BottomTabBar from "./BottomTabBar"

export default function ServiceAppLayout() {
  return (
    <div className="min-h-screen bg-[#F6F8FD]">
      <div className="mx-auto min-h-screen w-full max-w-[480px] bg-[#F6F8FD] pb-28 shadow-xl">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  )
}
