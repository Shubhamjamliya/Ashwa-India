import { useState, useEffect } from "react"
import { Code, HardDrive, Cloud, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { apiFetch } from "@/shared/lib/api"

const providers = [
  {
    key: "local",
    label: "Local Upload",
    icon: HardDrive,
    description: "Files are saved on this server's disk under /uploads",
  },
  {
    key: "cloudinary",
    label: "Cloudinary",
    icon: Cloud,
    description: "Files are uploaded to your Cloudinary account (CDN-hosted)",
  },
]

export default function DeveloperSettings() {
  const [provider, setProvider] = useState("local")
  const [cloudinaryConfigured, setCloudinaryConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [savedAt, setSavedAt] = useState(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/admin/system-settings/developer")
      setProvider(data.developerSettings?.imageUploadProvider || "local")
      setCloudinaryConfigured(data.cloudinaryConfigured)
    } catch (err) {
      setError(err.message || "Failed to load developer settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (key) => {
    if (key === provider || saving) return
    if (key === "cloudinary" && !cloudinaryConfigured) {
      setError("Cloudinary is not configured on the server (missing CLOUDINARY_* env vars)")
      return
    }
    setError("")
    setSaving(true)
    try {
      const data = await apiFetch("/admin/system-settings/developer", {
        method: "PUT",
        body: { imageUploadProvider: key },
      })
      setProvider(data.developerSettings.imageUploadProvider)
      setSavedAt(new Date())
    } catch (err) {
      setError(err.message || "Failed to update setting")
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
    <div className="px-4 pb-10 lg:px-6 pt-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
            <Code className="w-5 h-5 text-neutral-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Developer Settings</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Low-level configuration for how the platform is wired up</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Image Upload Provider</CardTitle>
            <p className="text-xs text-neutral-500 mt-1">
              Choose where uploaded images (logos, listing photos, product photos) are stored.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {providers.map((p) => {
              const Icon = p.icon
              const isActive = provider === p.key
              const disabled = p.key === "cloudinary" && !cloudinaryConfigured
              return (
                <button
                  key={p.key}
                  type="button"
                  disabled={disabled || saving}
                  onClick={() => handleSelect(p.key)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    isActive
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? "bg-primary text-white" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">{p.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{p.description}</p>
                    {p.key === "cloudinary" && !cloudinaryConfigured && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        Not configured on this server
                      </p>
                    )}
                  </div>
                  {isActive && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                </button>
              )
            })}

            {error && <p className="text-sm text-destructive">{error}</p>}
            {savedAt && !error && (
              <p className="text-sm text-emerald-600 font-medium">Saved at {savedAt.toLocaleTimeString()}</p>
            )}

            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-2">
              <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-xs text-neutral-700 space-y-1">
                <p className="font-semibold text-amber-700">Note</p>
                <p><span className="font-semibold">Cloudinary</span> — files are always stored on Cloudinary.</p>
                <p><span className="font-semibold">Local Upload</span> depends on the server's environment:</p>
                <ul className="list-disc list-inside pl-1 space-y-0.5">
                  <li><code className="bg-white px-1 rounded border border-amber-200">NODE_ENV=development</code> → stored at <code className="bg-white px-1 rounded border border-amber-200">backend/uploads</code></li>
                  <li><code className="bg-white px-1 rounded border border-amber-200">NODE_ENV=production</code> → stored at <code className="bg-white px-1 rounded border border-amber-200">/var/www/uploads</code></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
