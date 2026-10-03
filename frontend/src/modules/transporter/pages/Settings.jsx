import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Bell, LogOut, ShieldAlert, Trash2 } from "lucide-react"
import { useAuth } from "@/shared/context/AuthContext"

const PUSH_PREF_KEY = "ashwa_transporter_push_enabled"

export default function Settings() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [pushEnabled, setPushEnabled] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(PUSH_PREF_KEY)
    if (raw != null) setPushEnabled(raw === "true")
  }, [])

  const togglePush = () => {
    const next = !pushEnabled
    setPushEnabled(next)
    localStorage.setItem(PUSH_PREF_KEY, String(next))
  }

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return
    await logout()
    navigate("/transporter/login")
  }

  const handleDeleteAccount = () => {
    window.alert(
      "To permanently delete your account and data, please contact our support team — this helps us verify your identity before removing any data."
    )
  }

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
          <ArrowLeft className="h-5 w-5 text-[#0F2238]" />
        </button>
        <h1 className="text-lg font-bold text-[#0F2238]">Settings</h1>
      </div>

      <div className="px-4">
        <p className="mb-2 mt-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Preferences</p>
        <div className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
          <div className="flex items-center gap-2.5 px-4 py-3.5">
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[#F6E9C9]">
              <Bell className="h-[18px] w-[18px] text-[#C28D2E]" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#0F2238]">Push Notifications</p>
              <p className="mt-0.5 text-xs text-neutral-500">Get alerts for new requests and payouts</p>
            </div>
            <button
              onClick={togglePush}
              className={`relative h-6 w-11 rounded-full transition-colors ${pushEnabled ? "bg-[#C28D2E]" : "bg-[#E4E1D8]"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${pushEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-neutral-500">Account</p>
        <div className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
          <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left hover:bg-[#F1EEE6]">
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[#F6E9C9]">
              <LogOut className="h-[18px] w-[18px] text-[#C28D2E]" />
            </span>
            <span className="text-sm font-semibold text-[#0F2238]">Log out</span>
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-rose-200 bg-white">
          <button onClick={handleDeleteAccount} className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left hover:bg-rose-50">
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[#FEE2E2]">
              <Trash2 className="h-[18px] w-[18px] text-destructive" />
            </span>
            <span className="text-sm font-semibold text-destructive">Delete Account</span>
          </button>
        </div>

        <div className="mt-5 flex items-start gap-1.5">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" />
          <p className="text-[11px] leading-[15px] text-neutral-500">Your data is kept private and is never shared without your consent.</p>
        </div>
      </div>
    </div>
  )
}
