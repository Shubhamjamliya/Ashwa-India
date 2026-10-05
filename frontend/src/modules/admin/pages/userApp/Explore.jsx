import { useEffect, useState } from "react"
import { ImagePlus, Loader2, Save } from "lucide-react"
import { apiFetch, apiUpload } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]

// Each tile on the user app's "Explore Ashwa India" row.
const TILE_HINTS = {
  horses: "Opens the Horse Marketplace",
  providers: "Shows Service Providers",
  transport: "Opens Horse Transport booking",
  store: "Opens the Accessories Store",
  events: "Opens the list of events you publish",
  jobs: "Opens Horse Jobs for users and service providers",
}

function TileCard({ item, onSaved }) {
  const [label, setLabel] = useState(item.label)
  const [active, setActive] = useState(item.active)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const dirty = label !== item.label || active !== item.active || Boolean(file)
  const shownImage = preview || getMediaUrl(item.image)

  const pickFile = (e) => {
    const picked = e.target.files?.[0]
    if (!picked) return
    if (!ALLOWED_TYPES.includes(picked.type)) {
      setError("Upload a PNG, JPG or WEBP image")
      return
    }
    setError("")
    setSaved(false)
    setFile(picked)
  }

  const save = async () => {
    if (!label.trim()) {
      setError("Label is required")
      return
    }
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      let image = item.image
      if (file) {
        const form = new FormData()
        form.append("file", file)
        const uploaded = await apiUpload("/uploads/image", { method: "POST", formData: form })
        image = uploaded.url || image
      }
      const data = await apiFetch(`/explore/${item.key}`, { method: "PUT", body: { label: label.trim(), image, active } })
      onSaved(data.item)
      setFile(null)
      setPreview("")
      setSaved(true)
    } catch (err) {
      setError(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Tile {item.order + 1}</p>
          <p className="text-xs text-neutral-500">{TILE_HINTS[item.key]}</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-600">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-amber-600" />
          Show in app
        </label>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
          {shownImage ? (
            <img src={shownImage} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-neutral-400" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
            <ImagePlus className="h-4 w-4" />
            {file ? "Change image" : "Upload image"}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickFile} className="hidden" />
          </label>
          <p className="text-[11px] text-neutral-500">{file ? file.name : "PNG, JPG or WEBP. Square works best."}</p>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Label shown in the app</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-amber-500"
        />
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-emerald-600">{saved && !dirty ? "Saved" : ""}</span>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save tile
        </button>
      </div>
    </div>
  )
}

export default function Explore() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/explore/admin")
      .then((data) => setItems(data.items || []))
      .catch((err) => setError(err.message || "Failed to load explore tiles"))
      .finally(() => setLoading(false))
  }, [])

  const onSaved = (updated) => setItems((prev) => prev.map((i) => (i.key === updated.key ? updated : i)))

  return (
    <div className="min-h-screen space-y-6 p-4 lg:p-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Explore section</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          The four tiles under “Explore Ashwa India” on the user app home screen. Upload each tile&apos;s image and label here.
        </p>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <TileCard key={item.key} item={item} onSaved={onSaved} />
          ))}
        </div>
      )}
    </div>
  )
}
