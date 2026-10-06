import { useState, useEffect } from "react"
import { Code, HardDrive, Cloud, Loader2, CheckCircle2, AlertTriangle, Info, Trash2, ShieldAlert, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"

const providers = [
  { key: "local", label: "Local Upload", icon: HardDrive, description: "Files are saved on this server's disk under /uploads" },
  { key: "cloudinary", label: "Cloudinary", icon: Cloud, description: "Files are uploaded to your Cloudinary account (CDN-hosted)" },
]

export default function DeveloperSettings() {
  const [provider, setProvider] = useState("local")
  const [cloudinaryConfigured, setCloudinaryConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [savedAt, setSavedAt] = useState(null)

  const [counts, setCounts] = useState(null)
  const [countsLoading, setCountsLoading] = useState(false)
  const [confirmPhrase, setConfirmPhrase] = useState("")
  const [clearing, setClearing] = useState(false)
  const [clearResult, setClearResult] = useState(null)
  const [clearError, setClearError] = useState("")

  useEffect(() => {
    load()
    loadCounts()
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

  const loadCounts = async () => {
    setCountsLoading(true)
    try {
      setCounts(await apiFetch("/admin/system-settings/developer/operational-data"))
    } catch (err) {
      setClearError(err.message || "Could not load record counts")
    } finally {
      setCountsLoading(false)
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
      const data = await apiFetch("/admin/system-settings/developer", { method: "PUT", body: { imageUploadProvider: key } })
      setProvider(data.developerSettings.imageUploadProvider)
      setSavedAt(new Date())
    } catch (err) {
      setError(err.message || "Failed to update setting")
    } finally {
      setSaving(false)
    }
  }

  const clearOperational = async () => {
    setClearing(true)
    setClearError("")
    setClearResult(null)
    try {
      const result = await apiFetch("/admin/system-settings/developer/clear-operational-data", {
        method: "POST",
        body: { confirm: confirmPhrase },
      })
      setClearResult(result)
      setConfirmPhrase("")
      loadCounts()
    } catch (err) {
      setClearError(err.message || "Could not clear the data")
    } finally {
      setClearing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const confirmReady = confirmPhrase === counts?.confirmPhrase

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 text-white">
          <Code className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Developer Settings</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Low-level configuration and maintenance tools</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Upload provider */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Image upload provider</CardTitle>
            <p className="mt-1 text-xs text-neutral-500">Where uploaded images (logos, listing photos, product photos) are stored.</p>
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
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                    isActive ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                  } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-primary text-white" : "bg-neutral-100 text-neutral-500"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{p.label}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{p.description}</p>
                    {p.key === "cloudinary" && !cloudinaryConfigured && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="h-3 w-3" /> Not configured on this server
                      </p>
                    )}
                  </div>
                  {isActive && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                </button>
              )
            })}

            {error && <p className="text-sm text-destructive">{error}</p>}
            {savedAt && !error && <p className="text-sm font-medium text-emerald-600">Saved at {savedAt.toLocaleTimeString()}</p>}

            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="space-y-1 text-xs text-neutral-700">
                <p className="font-semibold text-amber-700">Note</p>
                <p>
                  <span className="font-semibold">Cloudinary</span> stores files on Cloudinary at all times.
                </p>
                <p>
                  <span className="font-semibold">Local upload</span> depends on the server environment:
                </p>
                <ul className="list-inside list-disc space-y-0.5 pl-1">
                  <li>
                    <code className="rounded border border-amber-200 bg-white px-1">NODE_ENV=development</code> saves to <code className="rounded border border-amber-200 bg-white px-1">backend/uploads</code>
                  </li>
                  <li>
                    <code className="rounded border border-amber-200 bg-white px-1">NODE_ENV=production</code> saves to <code className="rounded border border-amber-200 bg-white px-1">/var/www/uploads</code>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational data reset */}
        <Card className="h-fit border-red-200">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="h-5 w-5" /> Clear operational data
              </CardTitle>
              <button onClick={loadCounts} disabled={countsLoading} aria-label="Refresh counts" className="text-neutral-500 hover:text-neutral-800 disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${countsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Removes bookings, payments, wallet balances, enquiries and service bookings made in the app. Accounts, categories, products, services and settings are kept.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {counts ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {counts.groups.map((g) => (
                  <div key={g.key} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                    <span className="text-xs text-neutral-600">{g.label}</span>
                    <span className={`text-sm font-bold ${g.count ? "text-neutral-900" : "text-neutral-400"}`}>{g.count.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">{clearError || "Loading counts..."}</p>
            )}

            <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
              <span className="text-sm font-semibold text-neutral-700">Total records</span>
              <span className="text-lg font-extrabold text-neutral-900">{counts ? counts.total.toLocaleString("en-IN") : "—"}</span>
            </div>

            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-xs text-red-800">
                This cannot be undone. To continue, type <span className="font-mono font-bold">{counts?.confirmPhrase || "DELETE OPERATIONAL DATA"}</span> below.
              </p>
              <input
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder="Type the phrase to confirm"
                className="h-10 w-full rounded-lg border border-red-300 bg-white px-3 text-sm outline-none focus:border-red-500"
              />
              <Button variant="destructive" className="w-full" disabled={!confirmReady || clearing || !counts || counts.total === 0} onClick={clearOperational}>
                {clearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                {clearing ? "Clearing..." : "Clear operational data"}
              </Button>
              {counts?.total === 0 && <p className="text-center text-xs text-neutral-500">There is no operational data to clear.</p>}
            </div>

            {clearError && counts && <p className="text-sm text-destructive">{clearError}</p>}
            {clearResult && (
              <p className="text-sm font-medium text-emerald-700">Cleared {clearResult.total.toLocaleString("en-IN")} records. Accounts and catalogue are unchanged.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
