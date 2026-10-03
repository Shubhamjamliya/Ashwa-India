import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ImagePlus, Loader2, Save, Trash2, User as UserIcon } from "lucide-react"
import { apiFetch, apiUpload, getSession } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useAuth } from "@/shared/context/AuthContext"
import BackButton from "../components/BackButton"
import ProviderProfileFields, { profilePayload } from "../components/ProviderProfileFields"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]

function draftFrom(user) {
  return {
    businessName: user?.businessName || "",
    description: user?.description || "",
    experienceYears: user?.experienceYears ?? "",
    certifications: user?.certifications || "",
    email: user?.email || "",
    location: user?.location || "",
    serviceTypes: user?.serviceTypes || [],
    pricing: user?.pricing || [],
    serviceZones: (user?.serviceZones || []).map((z) => (typeof z === "string" ? z : z.id || z._id)),
  }
}

export default function EditProfile() {
  const navigate = useNavigate()
  const { user, login } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [profile, setProfile] = useState(() => draftFrom(user))
  const [gallery, setGallery] = useState(user?.gallery || [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const addPhotos = async (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ""
    if (picked.length === 0) return
    if (gallery.length + picked.length > 20) {
      setError("A gallery can hold up to 20 photos")
      return
    }
    if (picked.some((f) => !ALLOWED_TYPES.includes(f.type))) {
      setError("Upload PNG, JPG or WEBP images only")
      return
    }
    setUploading(true)
    setError("")
    try {
      const urls = []
      for (const file of picked) {
        const form = new FormData()
        form.append("file", file)
        const uploaded = await apiUpload("/uploads/image", { method: "POST", formData: form })
        if (uploaded.url) urls.push(uploaded.url)
      }
      setGallery((prev) => [...prev, ...urls])
    } catch (err) {
      setError(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError("Enter your name")
    if (!profile.serviceTypes.length) return setError("Select at least one service you offer")
    if (!profile.serviceZones.length) return setError("Select at least one service area")
    setSaving(true)
    setError("")
    try {
      const data = await apiFetch("/providers/me", {
        method: "PATCH",
        body: { name: name.trim(), gallery, ...profilePayload(profile) },
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
    <div className="pb-8">
      <div className="flex items-center gap-3 p-4">
        <BackButton />
        <h1 className="text-[17px] font-bold text-[#0F2238]">Edit Profile</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4 px-4">
        <div className="flex items-center gap-4 rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#C28D2E] bg-[#0B1C33]">
            <UserIcon className="h-7 w-7 text-[#C28D2E]" />
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#E4E1D8] px-3 text-sm outline-none focus:border-[#C28D2E]"
            />
            <p className="mt-1 text-[11px] text-neutral-500">{user?.phone}</p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#0F2238]">Gallery</p>
              <p className="text-[11px] text-neutral-500">Photos of your work, premises or equipment. Up to 20.</p>
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#C28D2E] px-3 py-2 text-xs font-bold text-[#C28D2E]">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {uploading ? "Uploading" : "Add photos"}
              <input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={addPhotos} className="hidden" disabled={uploading} />
            </label>
          </div>
          {gallery.length === 0 ? (
            <p className="text-xs text-neutral-500">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {gallery.map((url, index) => (
                <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl bg-[#F1EEE6]">
                  <img src={getMediaUrl(url)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setGallery((prev) => prev.filter((_, i) => i !== index))}
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <ProviderProfileFields value={profile} onChange={(patch) => setProfile((prev) => ({ ...prev, ...patch }))} />

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={saving || uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  )
}
