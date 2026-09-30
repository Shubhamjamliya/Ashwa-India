import { useState, useRef, useEffect } from "react"
import { Info, Phone, Upload, X, Loader2 } from "lucide-react"
import { apiFetch, apiUpload } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const LOGO_UPLOADERS = [
  { key: "logo", label: "Website Logo (Main)" },
  { key: "userLogo", label: "User App Logo" },
  { key: "providerLogo", label: "Provider App Logo" },
  { key: "transporterLogo", label: "Transporter App Logo" },
  { key: "favicon", label: "Favicon" },
]

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/x-icon"]

export default function BusinessSetup() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [savedAt, setSavedAt] = useState(null)

  const [previews, setPreviews] = useState({})
  const [files, setFiles] = useState({})
  const inputRefs = useRef({})

  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    phoneCountryCode: "+91",
    phoneNumber: "",
    address: "",
    state: "",
    pincode: "",
    region: "India",
  })

  useEffect(() => {
    fetchBusinessSettings()
  }, [])

  const fetchBusinessSettings = async () => {
    try {
      setLoading(true)
      const data = await apiFetch("/admin/system-settings/business-setup")
      const settings = data.businessSetup
      if (settings) {
        setFormData({
          companyName: settings.companyName || "",
          email: settings.email || "",
          phoneCountryCode: settings.phoneCountryCode || "+91",
          phoneNumber: settings.phoneNumber || "",
          address: settings.address || "",
          state: settings.state || "",
          pincode: settings.pincode || "",
          region: settings.region || "India",
        })

        const nextPreviews = {}
        LOGO_UPLOADERS.forEach(({ key }) => {
          if (settings[key]?.url) nextPreviews[key] = getMediaUrl(settings[key].url)
        })
        setPreviews(nextPreviews)
      }
    } catch (err) {
      setError(err.message || "Failed to load business settings")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (key, file) => {
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid file type. Please upload PNG, JPG, JPEG, or WEBP.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.")
      return
    }
    setError("")
    setFiles((prev) => ({ ...prev, [key]: file }))
    const reader = new FileReader()
    reader.onloadend = () => setPreviews((prev) => ({ ...prev, [key]: reader.result }))
    reader.readAsDataURL(file)
  }

  const clearFile = (key) => {
    setFiles((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setPreviews((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    if (inputRefs.current[key]) inputRefs.current[key].value = ""
  }

  const handleReset = () => {
    fetchBusinessSettings()
    setFiles({})
    LOGO_UPLOADERS.forEach(({ key }) => {
      if (inputRefs.current[key]) inputRefs.current[key].value = ""
    })
    setError("")
  }

  const handleSave = async () => {
    if (!formData.companyName.trim()) return setError("Company name is required")
    if (!formData.email.trim() || !EMAIL_REGEX.test(formData.email.trim())) {
      return setError("Please enter a valid email address")
    }
    if (!formData.phoneNumber.trim() || !/^\d{7,15}$/.test(formData.phoneNumber.trim())) {
      return setError("Please enter a valid phone number (7-15 digits)")
    }
    if (formData.pincode.trim() && !/^\d{4,10}$/.test(formData.pincode.trim())) {
      return setError("Please enter a valid pincode (4-10 digits)")
    }

    setError("")
    setSaving(true)
    try {
      const body = new FormData()
      Object.entries(formData).forEach(([key, value]) => body.append(key, value))
      Object.entries(files).forEach(([key, file]) => body.append(key, file))

      const data = await apiUpload("/admin/system-settings/business-setup", { formData: body })
      const settings = data.businessSetup
      const nextPreviews = { ...previews }
      LOGO_UPLOADERS.forEach(({ key }) => {
        if (settings[key]?.url) nextPreviews[key] = getMediaUrl(settings[key].url)
      })
      setPreviews(nextPreviews)
      setFiles({})
      setSavedAt(new Date())
    } catch (err) {
      setError(err.message || "Failed to save business settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-neutral-900">Business setup</h1>
          <p className="text-xs lg:text-sm text-neutral-500 mt-1">
            Manage your company information, logos and business rules.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3 max-w-md">
          <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs lg:text-sm text-neutral-700">
            <p className="font-semibold text-amber-700 mb-0.5">Note</p>
            <p>Don't forget to click "Save Information" below to save changes.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="px-4 py-4 border-b border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Company Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Company name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Your Company Name"
                value={formData.companyName}
                maxLength={50}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter Your Email"
                value={formData.email}
                maxLength={100}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Region <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.region}
                onChange={(e) => handleInputChange("region", e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              >
                <option value="India">India</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative w-32">
                  <select
                    value={formData.phoneCountryCode}
                    onChange={(e) => handleInputChange("phoneCountryCode", e.target.value)}
                    className="w-full pl-8 pr-2 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary appearance-none"
                  >
                    <option value="+91">+91 (IN)</option>
                  </select>
                  <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <input
                  type="text"
                  placeholder="Enter Your Phone Number"
                  value={formData.phoneNumber}
                  maxLength={15}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value.replace(/\D/g, ""))}
                  className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Address</label>
              <textarea
                rows={2}
                placeholder="Enter Your Address"
                value={formData.address}
                maxLength={250}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">State</label>
              <input
                type="text"
                placeholder="Enter Your State"
                value={formData.state}
                maxLength={50}
                onChange={(e) => handleInputChange("state", e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Pincode</label>
              <input
                type="text"
                placeholder="Enter Your Pincode"
                value={formData.pincode}
                maxLength={10}
                onChange={(e) => handleInputChange("pincode", e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 mt-6 border-t border-neutral-100 pt-4">
            <div className="col-span-full">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">App & Website Logos</h3>
              <p className="text-xs text-neutral-500 mb-4">Upload specific logos for each platform (max 5MB, PNG/JPG/WEBP)</p>
            </div>

            {LOGO_UPLOADERS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">{label}</label>
                <input
                  ref={(el) => (inputRefs.current[key] = el)}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/x-icon"
                  onChange={(e) => handleFileSelect(key, e.target.files?.[0])}
                  className="hidden"
                />
                <div
                  onClick={() => inputRefs.current[key]?.click()}
                  className="border border-dashed border-neutral-300 rounded-lg bg-neutral-50/60 h-28 flex items-center justify-center cursor-pointer hover:bg-neutral-100 transition-colors relative overflow-hidden"
                >
                  {previews[key] ? (
                    <>
                      <img src={previews[key]} alt={`${label} preview`} className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          clearFile(key)
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <Upload className="w-5 h-5 text-neutral-400 mx-auto mb-1" />
                      <p className="text-[10px] text-neutral-400">Upload {label}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </div>

        <div className="px-4 py-4 border-t border-neutral-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[11px] text-neutral-500">
              {savedAt ? (
                <span className="text-emerald-600 font-medium">Saved at {savedAt.toLocaleTimeString()}</span>
              ) : (
                <>Changes will only be applied after clicking <span className="font-semibold">Save Information</span>.</>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Information"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
