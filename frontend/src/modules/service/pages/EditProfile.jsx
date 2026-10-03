import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Mail, MapPinned, Phone, Save, Stethoscope } from "lucide-react"
import { apiFetch, getSession } from "@/shared/lib/api"
import { useAuth } from "@/shared/context/AuthContext"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import BackButton from "../components/BackButton"

export default function EditProfile() {
  const navigate = useNavigate()
  const { user, login } = useAuth()

  const [name, setName] = useState(user?.name || "")
  const [businessName, setBusinessName] = useState(user?.businessName || "")
  const [email, setEmail] = useState(user?.email || "")
  const [location, setLocation] = useState(user?.location || "")
  const [serviceTypes, setServiceTypes] = useState((user?.serviceTypes || []).join(", "))
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
      const data = await apiFetch("/providers/me", {
        method: "PATCH",
        body: {
          name: name.trim(),
          businessName: businessName.trim(),
          email: email.trim(),
          location: location.trim(),
          serviceTypes: serviceTypes.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean),
        },
      })
      const { accessToken, refreshToken } = getSession("provider")
      login({ accessToken, refreshToken, user: { ...user, ...data.provider, role: "provider" } })
      navigate(-1)
    } catch (err) {
      setError(err.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-6">
      <div className="flex items-center gap-3 p-4">
        <BackButton />
        <h1 className="text-[17px] font-bold text-[#0F2238]">Edit Profile</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-3 px-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Full Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
            <Building2 className="h-3.5 w-3.5" /> Business Name
          </label>
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your clinic or business name" />
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
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
            <MapPinned className="h-3.5 w-3.5" /> Base Location
          </label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Jaipur, Rajasthan" />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
            <Stethoscope className="h-3.5 w-3.5" /> Services Offered
          </label>
          <Input value={serviceTypes} onChange={(e) => setServiceTypes(e.target.value)} placeholder="e.g. vet, farrier, groomer" />
          <p className="mt-1 text-[11px] text-neutral-400">Comma-separated. Users can only book services you list here.</p>
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
