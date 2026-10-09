import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, Calculator, ImagePlus, Layers, Loader2, Pencil, Plus, Trash2, Truck, X } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Switch } from "@/shared/components/ui/switch"
import { apiFetch, apiUpload } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"

const blank = { name: "", description: "", icon: "", baseFare: "", pricePerKm: "", minFare: "", order: 0, active: true }
const money = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`
// Same formula as the server: max(minFare, baseFare + km × pricePerKm).
const fareFor = (t, km) => Math.max(Number(t.minFare) || 0, (Number(t.baseFare) || 0) + km * (Number(t.pricePerKm) || 0))
const isPriced = (t) => Number(t.pricePerKm) > 0

function TypeIcon({ icon, size = "h-12 w-12", iconSize = "h-6 w-6" }) {
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-50 ring-1 ring-amber-100 ${size}`}>
      {icon ? <img src={getMediaUrl(icon)} alt="" className="h-full w-full object-contain p-1.5" /> : <Truck className={`${iconSize} text-amber-700`} />}
    </span>
  )
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-neutral-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-neutral-500">{hint}</span>}
    </label>
  )
}

const inputClass = "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"

function MoneyInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">₹</span>
      <input type="number" min="0" step="1" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputClass} pl-7`} />
    </div>
  )
}

function TypeForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          description: initial.description || "",
          icon: initial.icon || "",
          baseFare: initial.baseFare ? String(initial.baseFare) : "",
          pricePerKm: initial.pricePerKm ? String(initial.pricePerKm) : "",
          minFare: initial.minFare ? String(initial.minFare) : "",
          order: initial.order ?? 0,
          active: initial.active,
        }
      : blank
  )
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef(null)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const uploadIcon = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("width", "256")
      formData.append("height", "256")
      const res = await apiUpload("/uploads/image", { method: "POST", formData })
      set("icon", res.url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError("Enter a name")
    if (!(Number(form.pricePerKm) > 0)) return setError("Set a price per km so users can book this type")
    setSaving(true)
    setError("")
    try {
      const body = {
        name: form.name,
        description: form.description,
        icon: form.icon,
        baseFare: Number(form.baseFare) || 0,
        pricePerKm: Number(form.pricePerKm) || 0,
        minFare: Number(form.minFare) || 0,
        order: Number(form.order) || 0,
        active: form.active,
      }
      if (initial) await apiFetch(`/vehicle-types/${initial._id}`, { method: "PUT", body })
      else await apiFetch("/vehicle-types", { method: "POST", body })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex max-h-[85vh] flex-col">
      <DialogHeader className="border-b border-neutral-100 px-6 py-4">
        <DialogTitle>{initial ? "Edit vehicle type" : "Add vehicle type"}</DialogTitle>
        <p className="text-xs text-neutral-500">Users see the name, icon and fare. Transporters pick this type for their vehicles.</p>
      </DialogHeader>

      <div className="space-y-5 overflow-y-auto px-6 py-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-amber-500"
            aria-label="Upload icon"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            ) : form.icon ? (
              <img src={getMediaUrl(form.icon)} alt="" className="h-full w-full object-contain p-2" />
            ) : (
              <ImagePlus className="h-6 w-6 text-neutral-400 group-hover:text-amber-600" />
            )}
          </button>
          <div className="text-xs text-neutral-500">
            <p className="font-semibold text-neutral-700">Icon</p>
            <p>Square PNG or WEBP with a clear background works best.</p>
            <div className="mt-1.5 flex gap-3">
              <button type="button" onClick={() => fileRef.current?.click()} className="font-semibold text-amber-700 hover:underline">
                {form.icon ? "Change" : "Upload"}
              </button>
              {form.icon && (
                <button type="button" onClick={() => set("icon", "")} className="font-semibold text-red-600 hover:underline">
                  Remove
                </button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadIcon} className="hidden" />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
          <Field label="Name">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Premium Horse Ambulance" className={inputClass} />
          </Field>
          <Field label="Sort order">
            <input type="number" value={form.order} onChange={(e) => set("order", e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Short description" hint="Shown under the name when users choose a vehicle.">
          <input
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="e.g. Padded stalls, AC, up to 2 horses"
            className={inputClass}
          />
        </Field>

        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-sm font-bold text-neutral-900">Pricing</p>
          <p className="mb-3 text-[11px] text-neutral-500">Fare = base fare + distance × price per km, never below the minimum fare.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Base fare">
              <MoneyInput value={form.baseFare} onChange={(v) => set("baseFare", v)} placeholder="0" />
            </Field>
            <Field label="Price per km">
              <MoneyInput value={form.pricePerKm} onChange={(v) => set("pricePerKm", v)} placeholder="e.g. 40" />
            </Field>
            <Field label="Minimum fare">
              <MoneyInput value={form.minFare} onChange={(v) => set("minFare", v)} placeholder="0" />
            </Field>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[10, 50, 150].map((km) => (
              <div key={km} className="rounded-lg bg-amber-50 px-3 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">{km} km trip</p>
                <p className="text-sm font-extrabold text-neutral-900">{isPriced(form) ? money(fareFor(form, km)) : "—"}</p>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-neutral-900">Active</span>
            <span className="block text-[11px] text-neutral-500">Off hides it from users and from transporters adding vehicles.</span>
          </span>
          <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>

      <div className="flex justify-end gap-2 border-t border-neutral-100 px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Saving..." : initial ? "Save changes" : "Add vehicle type"}
        </Button>
      </div>
    </form>
  )
}

function PriceItem({ label, value }) {
  return (
    <div className="min-w-[72px]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-sm font-bold text-neutral-900">{value}</p>
    </div>
  )
}

// One vehicle type per row, each row its own box, stacked vertically.
function TypeList({ types, km, busyId, onEdit, onDelete, onToggle }) {
  return (
    <ul className="space-y-3">
      {types.map((t, i) => (
        <li
          key={t._id}
          className={`rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
            t.active ? "border-neutral-200" : "border-dashed border-neutral-300 bg-neutral-50"
          }`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Identity */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="w-5 shrink-0 text-center text-xs font-bold text-neutral-400">{i + 1}</span>
              <TypeIcon icon={t.icon} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-base font-bold text-neutral-900">{t.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      !t.active ? "bg-neutral-200 text-neutral-600" : isPriced(t) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {!t.active ? "Off" : isPriced(t) ? "Bookable" : "No price"}
                  </span>
                </div>
                <p className="truncate text-xs text-neutral-500">{t.description || "No description"}</p>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  {t.vehicles} vehicle{t.vehicles === 1 ? "" : "s"} registered
                </p>
              </div>
            </div>

            {/* Pricing */}
            {isPriced(t) ? (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-neutral-100 lg:border-l lg:pl-6">
                <PriceItem label="Base fare" value={money(t.baseFare)} />
                <PriceItem label="Per km" value={money(t.pricePerKm)} />
                <PriceItem label="Min fare" value={money(t.minFare)} />
                <div className="rounded-xl bg-amber-50 px-3 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">{km} km fare</p>
                  <p className="text-base font-extrabold text-amber-700">{money(fareFor(t, km))}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 lg:border-l lg:pl-6">
                <AlertTriangle className="h-4 w-4 shrink-0" /> Set a price so users can book this type
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-3 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
                <Switch checked={t.active} disabled={busyId === t._id} onCheckedChange={() => onToggle(t)} aria-label={`${t.name} active`} />
                Active
              </label>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => onEdit(t)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <button
                  onClick={() => onDelete(t)}
                  aria-label={`Delete ${t.name}`}
                  disabled={t.vehicles > 0}
                  title={t.vehicles > 0 ? "In use — turn it off instead" : "Delete"}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function VehicleTypes() {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialog, setDialog] = useState(null) // null | "new" | type
  const [busyId, setBusyId] = useState(null)
  const [km, setKm] = useState(50)

  const load = () => {
    apiFetch("/vehicle-types/admin")
      .then((d) => setTypes(d.vehicleTypes || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const stats = useMemo(
    () => ({
      total: types.length,
      bookable: types.filter((t) => t.active && isPriced(t)).length,
      vehicles: types.reduce((s, t) => s + (t.vehicles || 0), 0),
    }),
    [types]
  )

  const toggle = async (t) => {
    setBusyId(t._id)
    setError("")
    try {
      const d = await apiFetch(`/vehicle-types/${t._id}`, { method: "PUT", body: { active: !t.active } })
      setTypes((prev) => prev.map((x) => (x._id === t._id ? { ...x, ...d.vehicleType } : x)))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.name}"? This cannot be undone.`)) return
    setError("")
    try {
      await apiFetch(`/vehicle-types/${t._id}`, { method: "DELETE" })
      setTypes((prev) => prev.filter((x) => x._id !== t._id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Vehicle Types & Fares</h1>
            <p className="text-sm text-neutral-500">Users pick a vehicle type and pay its fare. Requests go to nearby transporters who have that type.</p>
          </div>
          <Button onClick={() => setDialog("new")}>
            <Plus className="h-4 w-4" /> Add vehicle type
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Vehicle types", stats.total, Layers],
            ["Bookable by users", stats.bookable, Truck],
            ["Vehicles registered", stats.vehicles, Truck],
          ].map(([label, value, Icon]) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Icon className="h-5 w-5 text-amber-700" />
              </span>
              <div>
                <p className="text-xl font-extrabold text-neutral-900">{loading ? "—" : value}</p>
                <p className="text-xs text-neutral-500">{label}</p>
              </div>
            </div>
          ))}
          <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <Calculator className="h-5 w-5 text-amber-700" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-neutral-500">Preview fares for</span>
              <span className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  value={km}
                  onChange={(e) => setKm(Math.max(1, Number(e.target.value) || 1))}
                  className="h-8 w-20 rounded-md border border-neutral-300 px-2 text-sm font-bold outline-none focus:border-amber-600"
                />
                <span className="text-sm font-semibold text-neutral-700">km</span>
              </span>
            </span>
          </label>
        </div>

        {error && (
          <div className="flex items-start justify-between gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <button onClick={() => setError("")} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          </div>
        ) : types.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
            <Truck className="h-8 w-8 text-neutral-400" />
            <p className="text-sm text-neutral-500">No vehicle types yet.</p>
            <Button onClick={() => setDialog("new")}>
              <Plus className="h-4 w-4" /> Add the first one
            </Button>
          </div>
        ) : (
          <TypeList types={types} km={km} busyId={busyId} onEdit={setDialog} onDelete={remove} onToggle={toggle} />
        )}
      </div>

      <Dialog open={Boolean(dialog)} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-xl p-0">
          {dialog && (
            <TypeForm
              key={dialog === "new" ? "new" : dialog._id}
              initial={dialog === "new" ? null : dialog}
              onClose={() => setDialog(null)}
              onSaved={() => {
                setDialog(null)
                load()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
