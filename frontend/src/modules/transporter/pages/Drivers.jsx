import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, UserRound, X } from "lucide-react"
import { apiFetch, apiUpload } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import BackButton from "../components/BackButton"

const inputClass = "h-10 w-full rounded-lg border border-[#E4E1D8] bg-white px-3 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"

async function uploadPhoto(file) {
  const form = new FormData()
  form.append("file", file)
  return (await apiUpload("/uploads/image", { method: "POST", formData: form })).url
}

function DriverForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    phone: initial?.phone || "",
    licenseNumber: initial?.licenseNumber || "",
    licenseExpiresAt: initial?.licenseExpiresAt ? initial.licenseExpiresAt.slice(0, 10) : "",
    licenseImage: initial?.licenseImage || "",
    idProofImage: initial?.idProofImage || "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const upload = async (key, file) => {
    setError("")
    try {
      set(key, await uploadPhoto(file))
    } catch (err) {
      setError(err.message)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const body = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        licenseNumber: form.licenseNumber.trim() || undefined,
        licenseExpiresAt: form.licenseExpiresAt || undefined,
        licenseImage: form.licenseImage || "",
        idProofImage: form.idProofImage || "",
      }
      const data = initial
        ? await apiFetch(`/transporter-ops/drivers/${initial._id}`, { method: "PATCH", body })
        : await apiFetch("/transporter-ops/drivers", { method: "POST", body })
      onSaved(data.driver, Boolean(initial))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const photoRow = (key, label) => (
    <div className="flex items-center justify-between rounded-lg border border-[#E4E1D8] p-2">
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-[#0F2238]">{label}</p>
        <p className="text-[10px] text-neutral-500">{form[key] ? "Uploaded" : "Not uploaded"}</p>
      </div>
      <label className="cursor-pointer rounded-md border border-[#C28D2E] px-2 py-1 text-[11px] font-bold text-[#C28D2E]">
        Upload
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && upload(key, e.target.files[0])} className="hidden" />
      </label>
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#0F2238]">{initial ? "Edit driver" : "Add driver"}</p>
        <button type="button" onClick={onCancel} aria-label="Close"><X className="h-4 w-4 text-neutral-500" /></button>
      </div>
      <input className={inputClass} placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} />
      <input className={inputClass} placeholder="Mobile number" inputMode="numeric" value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass} placeholder="Licence number" value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} />
        <input type="date" className={inputClass} value={form.licenseExpiresAt} onChange={(e) => set("licenseExpiresAt", e.target.value)} title="Licence expiry" />
      </div>
      {photoRow("licenseImage", "Driving licence photo")}
      {photoRow("idProofImage", "ID proof photo")}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50">
        {saving ? "Saving..." : initial ? "Save driver" : "Add driver"}
      </button>
    </form>
  )
}

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/transporter-ops/drivers")
      .then((d) => setDrivers(d.drivers || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const onSaved = (driver, wasEdit) => {
    setDrivers((prev) => (wasEdit ? prev.map((d) => (d._id === driver._id ? driver : d)) : [driver, ...prev]))
    setEditing(null)
    setAdding(false)
  }

  const remove = async (d) => {
    if (!window.confirm(`Remove ${d.name}?`)) return
    try {
      await apiFetch(`/transporter-ops/drivers/${d._id}`, { method: "DELETE" })
      setDrivers((prev) => prev.filter((x) => x._id !== d._id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen pb-6">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <BackButton variant="dark" />
        <div>
          <h1 className="text-[18px] font-bold text-white">Drivers</h1>
          <p className="text-xs text-[#A9B8CC]">Who drives your trips</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {error && <p className="text-xs text-destructive">{error}</p>}
        {(adding || editing) ? (
          <DriverForm initial={editing} onCancel={() => { setAdding(false); setEditing(null) }} onSaved={onSaved} />
        ) : (
          <button onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#C28D2E] bg-white py-3 text-sm font-bold text-[#C28D2E]">
            <Plus className="h-4 w-4" /> Add driver
          </button>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /></div>
        ) : drivers.length === 0 && !adding ? (
          <p className="py-10 text-center text-sm text-neutral-500">No drivers yet. Add your first driver.</p>
        ) : (
          drivers.map((d) => (
            <div key={d._id} className="flex items-center gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F1EEE6]">
                {d.licenseImage ? <img src={getMediaUrl(d.licenseImage)} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-5 w-5 text-neutral-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#0F2238]">{d.name}</p>
                <p className="text-[11px] text-neutral-500">{d.phone}{d.licenseNumber ? ` · ${d.licenseNumber}` : ""}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${d.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"}`}>{d.isAvailable ? "Available" : "On trip"}</span>
              </div>
              <button onClick={() => { setAdding(false); setEditing(d) }} aria-label="Edit"><Pencil className="h-4 w-4 text-neutral-600" /></button>
              <button onClick={() => remove(d)} aria-label="Remove"><Trash2 className="h-4 w-4 text-rose-600" /></button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
