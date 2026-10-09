import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Building2, Mail, MapPinned, Phone, Save, User as UserIcon } from "lucide-react"
import { apiFetch, getSession } from "@/shared/lib/api"
import { useAuth } from "@/shared/context/AuthContext"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"

const SERVICE_TYPES = [
  { value: "private", label: "Private only" },
  { value: "shared", label: "Shared only" },
  { value: "both", label: "Private & Shared" },
]

export default function EditProfile() {
  const navigate = useNavigate()
  const { user, login } = useAuth()

  const [name, setName] = useState(user?.name || "")
  const [businessName, setBusinessName] = useState(user?.businessName || "")
  const [email, setEmail] = useState(user?.email || "")
  const [serviceArea, setServiceArea] = useState(user?.serviceArea || "")
  const [serviceType, setServiceType] = useState(user?.serviceType || "private")
  const [vehicleTypes, setVehicleTypes] = useState((user?.vehicleTypes || []).join(", "))
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
      const data = await apiFetch("/transporters/me", {
        method: "PATCH",
        body: {
          name: name.trim(),
          businessName: businessName.trim(),
          email: email.trim(),
          serviceArea: serviceArea.trim(),
          serviceType,
          vehicleTypes: vehicleTypes.split(",").map((v) => v.trim()).filter(Boolean),
        },
      })
      const { accessToken, refreshToken } = getSession("transporter")
      login({ accessToken, refreshToken, user: { ...user, ...data.transporter, role: "transporter" } })
      navigate(-1)
    } catch (err) {
      setError(err.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
          <ArrowLeft className="h-5 w-5 text-[#0F2238]" />
        </button>
        <h1 className="text-[17px] font-bold text-[#0F2238]">Edit Profile</h1>
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
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
            <Building2 className="h-3.5 w-3.5" /> Business Name
          </label>
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your transport business name" />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
            <Mail className="h-3.5 w-3.5" /> Email
          </label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
            <Phone className="h-3.5 w-3.5" /> Phone Number
          </label>
          <Input value={user?.phone || ""} disabled className="bg-neutral-50" />
          <p className="mt-1 text-[11px] text-neutral-400">Verified via OTP, can&apos;t be changed here.</p>
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
            <MapPinned className="h-3.5 w-3.5" /> Service Area
          </label>
          <Input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="e.g. Delhi NCR, Punjab" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Service Type</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#E4E1D8] bg-white px-3 text-sm text-[#0F2238]"
          >
            {SERVICE_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Vehicle Types</label>
          <Input value={vehicleTypes} onChange={(e) => setVehicleTypes(e.target.value)} placeholder="e.g. Open truck, Covered van" />
          <p className="mt-1 text-[11px] text-neutral-400">Comma-separated</p>
        </div>

        <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <p className="text-sm font-bold text-[#0F2238]">Pricing</p>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Fares are set by the admin for each vehicle type, so every transporter charges the same. Add your vehicles with the right type
            to receive requests for it.
          </p>
        </div>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        <Button type="submit" className="mt-2 w-full" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  )
}
