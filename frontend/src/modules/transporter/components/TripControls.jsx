import { useEffect, useState } from "react"
import { Camera, Pause, Play } from "lucide-react"
import { apiFetch, apiUpload } from "@/shared/lib/api"

const inputClass = "h-10 w-full rounded-lg border border-[#E4E1D8] bg-white px-3 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"

// Transporter-side controls for one accepted booking: vehicle and driver,
// pickup schedule, pause/resume and delivery proof. Hidden once the trip is delivered.
export default function TripControls({ request, onUpdated }) {
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicleId, setVehicleId] = useState(request.vehicle?._id || request.vehicle || "")
  const [driverId, setDriverId] = useState(request.driver?._id || request.driver || "")
  const [when, setWhen] = useState(request.pickupScheduledAt ? toLocalInput(request.pickupScheduledAt) : "")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [ok, setOk] = useState("")

  useEffect(() => {
    Promise.allSettled([apiFetch("/transporter-ops/vehicles"), apiFetch("/transporter-ops/drivers")]).then(([v, d]) => {
      if (v.status === "fulfilled") setVehicles(v.value.vehicles || [])
      if (d.status === "fulfilled") setDrivers(d.value.drivers || [])
    })
  }, [])

  const run = async (fn, message) => {
    setBusy(true)
    setError("")
    setOk("")
    try {
      const data = await fn()
      onUpdated?.(data.request)
      if (message) setOk(message)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const assign = () =>
    run(() => apiFetch(`/transport/requests/${request._id}/assign`, { method: "PATCH", body: { vehicleId, driverId } }), "Vehicle and driver saved.")

  const schedule = () =>
    run(
      () => apiFetch(`/transport/requests/${request._id}/schedule`, { method: "PATCH", body: { pickupScheduledAt: new Date(when).toISOString() } }),
      "Pickup time saved."
    )

  const togglePause = () =>
    run(
      () => apiFetch(`/transport/requests/${request._id}/pause`, { method: "PATCH", body: { paused: !request.paused } }),
      request.paused ? "Trip resumed." : "Trip paused. The user sees it as paused."
    )

  const uploadProof = async (file) => {
    setBusy(true)
    setError("")
    try {
      const form = new FormData()
      form.append("file", file)
      const uploaded = await apiUpload("/uploads/image", { method: "POST", formData: form })
      const data = await apiFetch(`/transport/requests/${request._id}/proof`, { method: "POST", body: { url: uploaded.url, note: note.trim() || undefined } })
      onUpdated?.(data.request)
      setNote("")
      setOk("Delivery proof uploaded.")
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const locked = request.stage === "to_pickup" || request.stage === "in_transit"
  const canProof = request.stage === "in_transit"
  const availableVehicles = vehicles.filter((v) => v.isAvailable || v._id === vehicleId)
  const availableDrivers = drivers.filter((d) => d.isAvailable || d._id === driverId)

  return (
    <div className="space-y-4 rounded-2xl border border-[#E4E1D8] bg-white p-4">
      <p className="text-sm font-bold text-[#0F2238]">Trip setup</p>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-neutral-700">Vehicle</label>
        <select className={inputClass} value={vehicleId} disabled={busy || locked} onChange={(e) => setVehicleId(e.target.value)}>
          <option value="">Choose a vehicle</option>
          {availableVehicles.map((v) => (
            <option key={v._id} value={v._id}>{v.registrationNumber} · {v.maxAnimals} animal(s)</option>
          ))}
        </select>
        <label className="block text-xs font-semibold text-neutral-700">Driver</label>
        <select className={inputClass} value={driverId} disabled={busy || locked} onChange={(e) => setDriverId(e.target.value)}>
          <option value="">Choose a driver</option>
          {availableDrivers.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
        {!locked && (
          <button onClick={assign} disabled={busy || !vehicleId || !driverId} className="w-full rounded-xl bg-[#0B1C33] py-2.5 text-sm font-bold text-white disabled:opacity-50">
            Save vehicle and driver
          </button>
        )}
      </div>

      {!locked && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-700">Pickup date and time</label>
          <input type="datetime-local" className={inputClass} value={when} disabled={busy} onChange={(e) => setWhen(e.target.value)} />
          <button onClick={schedule} disabled={busy || !when} className="w-full rounded-xl border border-[#C28D2E] py-2.5 text-sm font-bold text-[#C28D2E] disabled:opacity-50">
            Save pickup time
          </button>
        </div>
      )}

      {(request.stage === "scheduled" || locked) && (
        <button onClick={togglePause} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 py-2.5 text-sm font-bold text-neutral-800 disabled:opacity-50">
          {request.paused ? <><Play className="h-4 w-4" /> Resume trip</> : <><Pause className="h-4 w-4" /> Pause trip</>}
        </button>
      )}

      {canProof && (
        <div className="space-y-2 border-t border-[#E4E1D8] pt-3">
          <label className="block text-xs font-semibold text-neutral-700">Delivery proof (photo of the animal at drop-off)</label>
          <input className={inputClass} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#C28D2E] py-2.5 text-sm font-bold text-[#C28D2E]">
            <Camera className="h-4 w-4" /> {request.deliveryProof?.url ? "Upload another photo" : "Upload photo"}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && uploadProof(e.target.files[0])} />
          </label>
          {request.deliveryProof?.url && <p className="text-[11px] text-emerald-700">Proof on record.</p>}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {ok && <p className="text-xs text-emerald-700">{ok}</p>}
    </div>
  )
}

// Converts an ISO date to the value datetime-local expects (local time, no zone).
function toLocalInput(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
