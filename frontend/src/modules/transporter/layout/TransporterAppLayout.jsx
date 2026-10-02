import { Outlet } from "react-router-dom"

// Mirrors the native TransporterApp shell: a single screen with its own
// navy header (see IncomingRequestsScreen.tsx) — no separate app chrome.
export default function TransporterAppLayout() {
  return (
    <div className="min-h-screen bg-[#FAF7F1]">
      <div className="mx-auto min-h-screen w-full max-w-[480px] bg-[#FAF7F1] shadow-xl">
        <Outlet />
      </div>
    </div>
  )
}
