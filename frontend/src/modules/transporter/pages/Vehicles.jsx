import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Truck, X } from "lucide-react"
import { apiFetch, apiUpload } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import BackButton from "../components/BackButton"

export const VEHICLE_TYPE_LABEL = {
  "horse-trailer": "Horse trailer",
  "horse-van": "Horse van",
  "covered-truck": "Covered truck",
  "open-truck": "Open truck",
  "mini-truck": "Mini truck",
  other: "Other",
}

const DOCS = [
  { key: "registrationCertificate", label: "Registration certificate" },
  { key: "insurance", label: "Insurance" },
  { key: "fitness", label: "Fitness certificate" },
]

const blank = {
  vehicleType: "horse-trailer",
  registrationNumber: "",
  capacityKg: "",
  compartments: "1",
  maxAnimals: "1",
  dedicated: true,
  shared: false,
  images: [],
  documents: {},
}

const inputClass = "h-10 w-full rounded-lg border border-[#E4E1D8] bg-white px-3 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"

// Uploads a photo and returns its stored path.
async function uploadPhoto(file) {
  const form = new FormData()
  form.append("file", file)
  const res = await apiUpload("/uploads/image", { method: "POST", formData: form })
  return res.url
}

function VehicleForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(
    initial
      ? {
          ...blank,
          ...initial,
          capacityKg: initial.capacityKg ?? "",
          documents: Object.fromEntries(
            Object.entries(initial.documents || {}).map(([k, d]) => [k, { url: d?.url, expiresAt: d?.expiresAt ? d.expiresAt.slice(0, 10) : "" }])
          ),
        }
      : blank
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const addImage = async (e) => {
    const files = Array.from(e.target.files || [])
    setError("")
    try {
      for (const f of files) {
        const url = await uploadPhoto(f)
        setForm((p) => ({ ...p, images: [...p.images, url] }))
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const addDoc = async (key, file) => {
    setError("")
    try {
      const url = await uploadPhoto(file)
      setForm((p) => ({ ...p, documents: { ...p.documents, [key]: { ...(p.documents[key] || {}), url } } }))
    } catch (err) {
      setError(err.message)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const documents = Object.fromEntries(
        DOCS.filter((d) => form.documents[d.key]?.url).map((d) => [
          d.key,
          { url: form.documents[d.key].url, expiresAt: form.documents[d.key].expiresAt || undefined },
        ])
      )
      const body = {
        vehicleType: form.vehicleType,
        registrationNumber: form.registrationNumber,
        capacityKg: form.capacityKg === "" ? undefined : Number(form.capacityKg),
        compartments: Number(form.compartments) || 1,
        maxAnimals: Number(form.maxAnimals) || 1,
        dedicated: form.dedicated,
        shared: form.shared,
        images: form.images,
        documents,
      }
      const data = initial
        ? await apiFetch(`/transporter-ops/vehicles/${initial._id}`, { method: "PATCH", body })
        : await apiFetch("/transporter-ops/vehicles", { method: "POST", body })
      onSaved(data.vehicle, Boolean(initial))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#0F2238]">{initial ? "Edit vehicle" : "Add vehicle"}</p>
        <button type="button" onClick={onCancel} aria-label="Close"><X className="h-4 w-4 text-neutral-500" /></button>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-neutral-700">Vehicle type</label>
        <select className={inputClass} value={form.vehicleType} onChange={(e) => set("vehicleType", e.target.value)}>
          {Object.entries(VEHICLE_TYPE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-neutral-700">Registration number</label>
        <input className={`${inputClass} uppercase`} value={form.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} placeholder="RJ14 AB 1234" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Capacity (kg)</label>
          <input inputMode="numeric" className={inputClass} value={form.capacityKg} onChange={(e) => set("capacityKg", e.target.value.replace(/\D/g, ""))} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Compartments</label>
          <input inputMode="numeric" className={inputClass} value={form.compartments} onChange={(e) => set("compartments", e.target.value.replace(/\D/g, ""))} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-neutral-700">Max animals</label>
          <input inputMode="numeric" className={inputClass} value={form.maxAnimals} onChange={(e) => set("maxAnimals", e.target.value.replace(/\D/g, ""))} />
        </div>
      </div>
      <div className="flex gap-4 text-sm font-semibold text-[#0F2238]">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.dedicated} onChange={(e) => set("dedicated", e.target.checked)} className="accent-amber-600" />Dedicated</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.shared} onChange={(e) => set("shared", e.target.checked)} className="accent-amber-600" />Shared</label>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold text-neutral-700">Vehicle photos</p>
        <div className="flex flex-wrap gap-2">
          {form.images.map((u, i) => (
            <div key={u + i} className="relative h-16 w-16 overflow-hidden rounded-lg bg-[#F1EEE6]">
              <img src={getMediaUrl(u)} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => set("images", form.images.filter((_, j) => j !== i))} className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5"><X className="h-3 w-3 text-white" /></button>
            </div>
          ))}
          <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#C28D2E] text-[#C28D2E]">
            <Plus className="h-5 w-5" />
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={addImage} className="hidden" />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-neutral-700">Documents (photo) and expiry</p>
        {DOCS.map((d) => {
          const doc = form.documents[d.key] || {}
          return (
            <div key={d.key} className="flex items-center gap-2 rounded-lg border border-[#E4E1D8] p-2">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-[#0F2238]">{d.label}</p>
                <p className="text-[10px] text-neutral-500">{doc.url ? "Uploaded" : "Not uploaded"}</p>
              </div>
              <input type="date" className="h-8 rounded-md border border-[#E4E1D8] px-1 text-[11px]" value={doc.expiresAt || ""} onChange={(e) => set("documents", { ...form.documents, [d.key]: { ...doc, expiresAt: e.target.value } })} />
              <label className="cursor-pointer rounded-md border border-[#C28D2E] px-2 py-1 text-[11px] font-bold text-[#C28D2E]">
                Upload
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && addDoc(d.key, e.target.files[0])} className="hidden" />
              </label>
            </div>
          )
        })}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50">
        {saving ? "Saving..." : initial ? "Save vehicle" : "Add vehicle"}
      </button>
    </form>
  )
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/transporter-ops/vehicles")
      .then((d) => setVehicles(d.vehicles || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const onSaved = (vehicle, wasEdit) => {
    setVehicles((prev) => (wasEdit ? prev.map((v) => (v._id === vehicle._id ? vehicle : v)) : [vehicle, ...prev]))
    setEditing(null)
    setAdding(false)
  }

  const remove = async (v) => {
    if (!window.confirm(`Remove ${v.registrationNumber}?`)) return
    try {
      await apiFetch(`/transporter-ops/vehicles/${v._id}`, { method: "DELETE" })
      setVehicles((prev) => prev.filter((x) => x._id !== v._id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen pb-6">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <BackButton variant="dark" />
        <div>
          <h1 className="text-[18px] font-bold text-white">Vehicles</h1>
          <p className="text-xs text-[#A9B8CC]">Your fleet, documents and availability</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {error && <p className="text-xs text-destructive">{error}</p>}
        {(adding || editing) ? (
          <VehicleForm initial={editing} onCancel={() => { setAdding(false); setEditing(null) }} onSaved={onSaved} />
        ) : (
          <button onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#C28D2E] bg-white py-3 text-sm font-bold text-[#C28D2E]">
            <Plus className="h-4 w-4" /> Add vehicle
          </button>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /></div>
        ) : vehicles.length === 0 && !adding ? (
          <p className="py-10 text-center text-sm text-neutral-500">No vehicles yet. Add your first vehicle.</p>
        ) : (
          vehicles.map((v) => (
            <div key={v._id} className="flex items-center gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F1EEE6]">
                {v.images?.[0] ? <img src={getMediaUrl(v.images[0])} alt="" className="h-full w-full object-cover" /> : <Truck className="m-4 h-6 w-6 text-neutral-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#0F2238]">{v.registrationNumber}</p>
                <p className="text-[11px] text-neutral-500">{VEHICLE_TYPE_LABEL[v.vehicleType]} · {v.maxAnimals} animal{v.maxAnimals === 1 ? "" : "s"}</p>
                <div className="mt-1 flex gap-1">
                  {v.dedicated && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Dedicated</span>}
                  {v.shared && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">Shared</span>}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${v.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"}`}>{v.isAvailable ? "Available" : "On trip"}</span>
                </div>
              </div>
              <button onClick={() => { setAdding(false); setEditing(v) }} aria-label="Edit"><Pencil className="h-4 w-4 text-neutral-600" /></button>
              <button onClick={() => remove(v)} aria-label="Remove"><Trash2 className="h-4 w-4 text-rose-600" /></button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
