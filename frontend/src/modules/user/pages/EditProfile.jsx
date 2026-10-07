import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, User as UserIcon } from "lucide-react"
import { apiFetch, getSession } from "@/shared/lib/api"
import { useAuth } from "@/shared/context/AuthContext"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"

export default function EditProfile() {
  const navigate = useNavigate()
  const { user, login } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Enter your name")
      return
    }
    setError("")
    setSaving(true)
    try {
      const data = await apiFetch("/users/me", { method: "PATCH", body: { name: name.trim(), email: email.trim() } })
      const { accessToken, refreshToken } = getSession("user")
      login({ accessToken, refreshToken, user: data.user })
      navigate(-1)
    } catch (err) {
      setError(err.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-30 flex items-center gap-2 bg-[#0B1C33] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-[17px] font-bold text-white">Edit Profile</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-3 px-4">
        <div className="mb-2 flex justify-center">
          <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-[3px] border-[#C28D2E]">
            <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-[#0B1C33]">
              <UserIcon className="h-8 w-8 text-[#C28D2E]" />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Full Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Email (optional)</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Phone Number</label>
          <Input value={user?.phone || ""} disabled className="bg-neutral-50" />
          <p className="mt-1 text-[11px] text-neutral-400">Phone number is verified via OTP and can&apos;t be changed here.</p>
        </div>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        <Button type="submit" className="mt-2 w-full" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  )
}
