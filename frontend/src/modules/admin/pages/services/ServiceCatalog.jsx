import { useEffect, useState } from "react"
import { ImagePlus, Loader2, Pencil, Plus, Save, Trash2, Wrench, X } from "lucide-react"
import { apiFetch, apiUpload } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]

const emptyForm = { name: "", description: "", image: "", order: 0, active: true }

function ServiceForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(initial ? { ...initial } : emptyForm)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const shownImage = preview || getMediaUrl(form.image)

  const pickFile = (e) => {
    const picked = e.target.files?.[0]
    if (!picked) return
    if (!ALLOWED_TYPES.includes(picked.type)) {
      setError("Upload a PNG, JPG or WEBP image")
      return
    }
    setError("")
    setFile(picked)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError("Name is required")
    setSaving(true)
    setError("")
    try {
      let image = form.image
      if (file) {
        const data = new FormData()
        data.append("file", file)
        const uploaded = await apiUpload("/uploads/image", { method: "POST", formData: data })
        image = uploaded.url || image
      }
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        image,
        order: Number(form.order) || 0,
        active: form.active,
      }
      const saved = initial
        ? await apiFetch(`/service-catalog/${initial._id}`, { method: "PUT", body })
        : await apiFetch("/service-catalog", { method: "POST", body })
      onSaved(saved.service, Boolean(initial))
    } catch (err) {
      setError(err.message || "Failed to save service")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900">{initial ? "Edit service" : "New service"}</h2>
        <button type="button" onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100">
          <X className="h-4 w-4 text-neutral-500" />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
        <div>
          <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
            {shownImage ? <img src={shownImage} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-neutral-400" />}
          </div>
          <label className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
            <ImagePlus className="h-4 w-4" />
            {shownImage ? "Change image" : "Upload image"}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickFile} className="hidden" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Service name</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Veterinary care"
              className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-amber-500"
            />
            {initial && <p className="mt-1 text-[11px] text-neutral-500">Renaming keeps providers&apos; existing selections.</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Display order</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => set("order", e.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What this service covers, shown to users when they choose it"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-neutral-700 sm:col-span-2">
            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-amber-600" />
            Show in the user app and provider sign-up
          </label>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initial ? "Save changes" : "Create service"}
        </button>
      </div>
    </form>
  )
}

export default function ServiceCatalog() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    apiFetch("/service-catalog/admin")
      .then((data) => setServices(data.services || []))
      .catch((err) => setError(err.message || "Failed to load services"))
      .finally(() => setLoading(false))
  }, [])

  const onSaved = (service, wasEdit) => {
    setServices((prev) => (wasEdit ? prev.map((s) => (s._id === service._id ? service : s)) : [...prev, service]))
    setEditing(null)
    setCreating(false)
  }

  const remove = async (service) => {
    if (!window.confirm(`Delete "${service.name}"? Providers who selected it will lose it.`)) return
    try {
      await apiFetch(`/service-catalog/${service._id}`, { method: "DELETE" })
      setServices((prev) => prev.filter((s) => s._id !== service._id))
    } catch (err) {
      setError(err.message || "Failed to delete service")
    }
  }

  const showForm = creating || editing

  return (
    <div className="min-h-screen space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Services</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            The services users can book, and that providers choose from when they register. Only services added here appear in the app.
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> New service
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {showForm && (
        <ServiceForm
          initial={editing}
          onCancel={() => {
            setEditing(null)
            setCreating(false)
          }}
          onSaved={onSaved}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                {["Service", "Description", "Order", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-600" />
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Wrench className="mx-auto h-8 w-8 text-neutral-300" />
                    <p className="mt-2 text-sm font-semibold text-neutral-700">No services yet</p>
                    <p className="text-xs text-neutral-500">Add the first service. Providers will be able to pick it at sign-up.</p>
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service._id} className="text-sm">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                          {service.image && <img src={getMediaUrl(service.image)} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">{service.name}</p>
                          <p className="text-[11px] text-neutral-400">{service.key}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs truncate px-5 py-3 text-neutral-600">{service.description || "—"}</td>
                    <td className="px-5 py-3 text-neutral-600">{service.order}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${service.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"}`}>
                        {service.active ? "Live" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setCreating(false)
                            setEditing(service)
                            window.scrollTo({ top: 0, behavior: "smooth" })
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4 text-neutral-600" />
                        </button>
                        <button onClick={() => remove(service)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-rose-50" aria-label="Delete">
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
