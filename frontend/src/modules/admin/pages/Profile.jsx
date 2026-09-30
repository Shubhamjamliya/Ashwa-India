import { useState, useEffect, useRef } from "react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { User, Mail, Phone, Save, Loader2, Upload, X, Pencil, Eye, EyeOff } from "lucide-react"
import { apiFetch, apiUpload, getSession } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useAuth } from "@/shared/context/AuthContext"

export default function AdminProfile() {
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

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", profileImage: "" })
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [showPasswords, setShowPasswords] = useState({ currentPassword: false, newPassword: false, confirmPassword: false })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const data = await apiFetch("/admin/profile")
      setProfile(data.admin)
      setFormData({
        name: data.admin.name || "",
        email: data.admin.email || "",
        phone: data.admin.phone || "",
        profileImage: data.admin.profileImage || "",
      })
    } catch (err) {
      setError(err.message || "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }))

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
    setFormData((prev) => ({ ...prev, profileImage: "" }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const resetPasswordFields = () => {
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setShowPasswords({ currentPassword: false, newPassword: false, confirmPassword: false })
  }

  const handleStartEditing = () => {
    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      profileImage: profile?.profileImage || "",
    })
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    resetPasswordFields()
    setError("")
    setSuccess("")
    setIsEditMode(true)
  }

  const handleCancelEditing = () => {
    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      profileImage: profile?.profileImage || "",
    })
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    resetPasswordFields()
    setError("")
    setIsEditMode(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const currentPassword = passwordData.currentPassword.trim()
    const newPassword = passwordData.newPassword.trim()
    const confirmPassword = passwordData.confirmPassword.trim()
    const wantsPasswordChange = Boolean(currentPassword || newPassword || confirmPassword)

    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("Please fill Old, New, and Confirm password fields.")
        return
      }
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters.")
        return
      }
      if (newPassword !== confirmPassword) {
        setError("New password and Confirm password do not match.")
        return
      }
    }

    setSaving(true)
    try {
      let profileImageUrl = formData.profileImage

      if (selectedFile) {
        setUploading(true)
        const uploadForm = new FormData()
        uploadForm.append("file", selectedFile)
        const uploadRes = await apiUpload("/uploads/image", { method: "POST", formData: uploadForm })
        profileImageUrl = uploadRes.url || profileImageUrl
        setUploading(false)
      }

      const data = await apiFetch("/admin/profile", {
        method: "PUT",
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          profileImage: profileImageUrl || "",
        },
      })

      setProfile(data.admin)
      setFormData({
        name: data.admin.name || "",
        email: data.admin.email || "",
        phone: data.admin.phone || "",
        profileImage: data.admin.profileImage || "",
      })
      setSelectedFile(null)
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""

      // Refresh the stored session so the navbar/sidebar reflect the new name/email/avatar.
      const { accessToken, refreshToken, user } = getSession("admin")
      if (accessToken && refreshToken) {
        login({ accessToken, refreshToken, user: { ...user, ...data.admin } })
      }

      if (wantsPasswordChange) {
        try {
          await apiFetch("/admin/profile/password", { method: "PUT", body: { currentPassword, newPassword } })
          resetPasswordFields()
          setSuccess("Profile and password updated successfully")
          setIsEditMode(false)
        } catch (passwordError) {
          setError(passwordError.message || "Profile updated, but password change failed")
          return
        }
      } else {
        resetPasswordFields()
        setSuccess("Profile updated successfully")
        setIsEditMode(false)
      }
    } catch (err) {
      setError(err.message || "Failed to update profile")
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return "AD"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const maskEmail = (email) => {
    if (!email) return ""
    const [localPart, domain] = email.split("@")
    if (localPart.length <= 2) return email
    return localPart[0] + "*".repeat(Math.min(localPart.length - 1, 5)) + "@" + domain
  }

  const resolvedImage = imagePreview || (profile?.profileImage ? getMediaUrl(profile.profileImage) : null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Profile</h1>
        <p className="text-neutral-600 mt-1">Manage your admin profile information</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                {isEditMode ? "Update your profile details below" : "View your admin profile details"}
              </CardDescription>
            </div>
            {!isEditMode ? (
              <Button type="button" onClick={handleStartEditing}>
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={handleCancelEditing} disabled={saving || uploading}>
                  Cancel
                </Button>
                <Button type="submit" form="admin-profile-form" disabled={saving || uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading image...
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form id="admin-profile-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-neutral-200">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border-2 border-neutral-300 shrink-0">
                {resolvedImage ? (
                  <img src={resolvedImage} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-semibold text-neutral-600">{getInitials(profile.name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900">{profile.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{maskEmail(profile.email)}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Access level: <span className="font-medium">{profile.accessLevel || "Full Access"}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={!isEditMode || saving || uploading}
                  className={`h-11 ${!isEditMode ? "bg-neutral-50" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={!isEditMode || saving || uploading}
                  className={`h-11 ${!isEditMode ? "bg-neutral-50" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number (optional)"
                  disabled={!isEditMode || saving || uploading}
                  className={`h-11 ${!isEditMode ? "bg-neutral-50" : ""}`}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profileImage">Profile Image</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="profileImage"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileSelect}
                  disabled={!isEditMode || saving || uploading}
                  className="hidden"
                />
                {resolvedImage ? (
                  <div className="relative w-48 h-48 border-2 border-neutral-300 rounded-lg overflow-hidden group">
                    <img src={resolvedImage} alt="Profile" className="w-full h-full object-cover" />
                    {isEditMode && (
                      <>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <label
                            htmlFor="profileImage"
                            className="cursor-pointer bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors"
                          >
                            Change Image
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <label
                    htmlFor="profileImage"
                    className={`flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-neutral-300 rounded-lg transition-colors bg-neutral-50 ${
                      isEditMode ? "cursor-pointer hover:border-neutral-400" : "cursor-not-allowed opacity-70"
                    }`}
                  >
                    <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                    <p className="text-sm text-neutral-600">{isEditMode ? "Click to upload" : "No profile image"}</p>
                    <p className="text-xs text-neutral-500 mt-1">PNG, JPG, WEBP (max 5MB)</p>
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Old Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.currentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter old password"
                    disabled={!isEditMode || saving || uploading}
                    className={`h-11 pr-11 ${!isEditMode ? "bg-neutral-50" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, currentPassword: !p.currentPassword }))}
                    disabled={!isEditMode || saving || uploading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
                  >
                    {showPasswords.currentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.newPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    disabled={!isEditMode || saving || uploading}
                    className={`h-11 pr-11 ${!isEditMode ? "bg-neutral-50" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, newPassword: !p.newPassword }))}
                    disabled={!isEditMode || saving || uploading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
                  >
                    {showPasswords.newPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    disabled={!isEditMode || saving || uploading}
                    className={`h-11 pr-11 ${!isEditMode ? "bg-neutral-50" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => ({ ...p, confirmPassword: !p.confirmPassword }))}
                    disabled={!isEditMode || saving || uploading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
                  >
                    {showPasswords.confirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-emerald-600 font-medium">{success}</p>}

            <div className="pt-4 border-t border-neutral-200 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Account Status</span>
                <span className={`font-medium capitalize ${profile.status === "active" ? "text-emerald-600" : "text-red-600"}`}>
                  {profile.status}
                </span>
              </div>
              {profile.createdAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Member Since</span>
                  <span className="text-neutral-900">{new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
