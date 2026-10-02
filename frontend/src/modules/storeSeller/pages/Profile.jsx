import { useEffect, useRef, useState } from "react"
import { Building2, Loader2, Mail, Pencil, Phone, Save, Upload, User, X } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { apiFetch, apiUpload, getSession } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useAuth } from "@/shared/context/AuthContext"

const statusStyles = {
  approved: "text-emerald-600",
  pending: "text-amber-600",
  suspended: "text-rose-600",
  rejected: "text-rose-600",
  archived: "text-neutral-500",
}

export default function StoreSellerProfile() {
  const { login } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({ name: "", email: "", businessName: "" })

  useEffect(() => {
    fetchProfile()
  }, [])

  const applyProfile = (seller) => {
    setProfile(seller)
    setFormData({ name: seller.name || "", email: seller.email || "", businessName: seller.businessName || "" })
  }

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const data = await apiFetch("/auth/me")
      applyProfile(data.user)
    } catch (err) {
      setError(err.message || "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload PNG, JPG, JPEG, or WEBP.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.")
      return
    }
    setError("")
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleStartEditing = () => {
    applyProfile(profile)
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setError("")
    setSuccess("")
    setIsEditMode(true)
  }

  const handleCancelEditing = () => {
    applyProfile(profile)
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setError("")
    setIsEditMode(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError("Name is required")
      return
    }

    setError("")
    setSaving(true)
    try {
      let logo = profile?.logo

      if (selectedFile) {
        setUploading(true)
        const uploadForm = new FormData()
        uploadForm.append("file", selectedFile)
        logo = await apiUpload("/uploads/image", { method: "POST", formData: uploadForm })
        setUploading(false)
      }

      const data = await apiFetch("/store/sellers/me", {
        method: "PATCH",
        body: { name: formData.name.trim(), email: formData.email.trim(), businessName: formData.businessName.trim(), logo },
      })

      applyProfile(data.seller)
      setSelectedFile(null)
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""

      // Refresh the stored session so the navbar reflects the new name/logo.
      const { accessToken, refreshToken, user } = getSession("store-seller")
      if (accessToken && refreshToken) {
        login({ accessToken, refreshToken, user: { ...user, ...data.seller } })
      }

      setSuccess("Profile updated successfully")
      setIsEditMode(false)
    } catch (err) {
      setError(err.message || "Failed to update profile")
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return "SS"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const resolvedImage = imagePreview || (profile?.logo?.url ? getMediaUrl(profile.logo.url) : null)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-neutral-600">{error || "Failed to load profile data"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Profile</h1>
        <p className="mt-1 text-neutral-600">Manage your store profile information</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                {isEditMode ? "Update your store details below" : "View your store profile details"}
              </CardDescription>
            </div>
            {!isEditMode ? (
              <Button type="button" onClick={handleStartEditing}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={handleCancelEditing} disabled={saving || uploading}>
                  Cancel
                </Button>
                <Button type="submit" form="store-seller-profile-form" disabled={saving || uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form id="store-seller-profile-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-6 border-b border-neutral-200 pb-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-neutral-300 bg-neutral-100">
                {resolvedImage ? (
                  <img src={resolvedImage} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-semibold text-neutral-600">{getInitials(profile.name)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900">{profile.businessName || profile.name}</p>
                <p className="mt-1 text-xs text-neutral-500">{profile.phone}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Status: <span className={`font-medium capitalize ${statusStyles[profile.status] || ""}`}>{profile.status}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                  required
                  disabled={!isEditMode || saving || uploading}
                  className={`h-11 ${!isEditMode ? "bg-neutral-50" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Store / Business Name
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Your store name"
                  disabled={!isEditMode || saving || uploading}
                  className={`h-11 ${!isEditMode ? "bg-neutral-50" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="you@example.com"
                  disabled={!isEditMode || saving || uploading}
                  className={`h-11 ${!isEditMode ? "bg-neutral-50" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input type="tel" value={profile.phone || ""} disabled className="h-11 bg-neutral-50" />
                <p className="text-xs text-neutral-400">Phone number is verified at login and can't be changed here.</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logo">Store Logo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="logo"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileSelect}
                  disabled={!isEditMode || saving || uploading}
                  className="hidden"
                />
                {resolvedImage ? (
                  <div className="group relative h-40 w-40 overflow-hidden rounded-lg border-2 border-neutral-300">
                    <img src={resolvedImage} alt="Store logo" className="h-full w-full object-cover" />
                    {isEditMode && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                          <label
                            htmlFor="logo"
                            className="cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-100"
                          >
                            Change
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute right-2 top-2 z-10 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors hover:bg-red-600"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <label
                    htmlFor="logo"
                    className={`flex h-40 w-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 transition-colors ${
                      isEditMode ? "cursor-pointer hover:border-neutral-400" : "cursor-not-allowed opacity-70"
                    }`}
                  >
                    <Upload className="mb-2 h-7 w-7 text-neutral-400" />
                    <p className="text-sm text-neutral-600">{isEditMode ? "Click to upload" : "No logo set"}</p>
                    <p className="mt-1 text-xs text-neutral-500">PNG, JPG, WEBP (max 5MB)</p>
                  </label>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm font-medium text-emerald-600">{success}</p>}

            {profile.createdAt && (
              <div className="space-y-2 border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Seller Since</span>
                  <span className="text-neutral-900">{new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
