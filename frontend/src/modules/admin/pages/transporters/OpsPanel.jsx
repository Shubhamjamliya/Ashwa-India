import { useEffect, useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"
import { useVehicleTypes } from "@/shared/lib/vehicleTypes"

const KYC_LABEL = {
  not_submitted: "Not submitted",
  submitted: "Waiting for review",
  verified: "Verified",
  rejected: "Rejected",
}

const DOC_LINKS = [
  ["identityProof", "Identity proof"],
  ["businessLicense", "Business licence"],
]

// Admin-side KYC review, dedicated/shared switches and fleet view for one transporter.
// Rendered inside the transporter details dialog.
export default function OpsPanel({ transporter, onChanged }) {
  const { labelOf } = useVehicleTypes()
  const [kyc, setKyc] = useState(transporter.kyc || {})
  const [controls, setControls] = useState({
    dedicatedEnabled: transporter.dedicatedEnabled !== false,
    sharedEnabled: transporter.sharedEnabled !== false,
  })
  const [fleet, setFleet] = useState({ vehicles: [], drivers: [] })
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setKyc(transporter.kyc || {})
    setControls({
      dedicatedEnabled: transporter.dedicatedEnabled !== false,
      sharedEnabled: transporter.sharedEnabled !== false,
    })
    setReason("")
    setError("")
    apiFetch(`/transporter-ops/admin/transporters/${transporter._id}/fleet`)
      .then(setFleet)
      .catch((err) => setError(err.message))
  }, [transporter])

  const run = async (fn) => {
    setBusy(true)
    setError("")
    try {
      await fn()
      onChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const decideKyc = (action) =>
    run(async () => {
      const d = await apiFetch(`/transporter-ops/admin/kyc/${transporter._id}`, { method: "PATCH", body: { action, reason } })
      setKyc(d.kyc)
      setReason("")
    })

  const toggle = (key) =>
    run(async () => {
      const next = { ...controls, [key]: !controls[key] }
      await apiFetch(`/transporter-ops/admin/transporters/${transporter._id}/controls`, { method: "PATCH", body: next })
      setControls(next)
    })

  const docUrl = (u) => (u ? u : null)

  return (
    <div className="space-y-4 border-t border-neutral-200 pt-4">
      {error && <p className="text-xs text-red-600">{error}</p>}

      <section className="space-y-2 rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-neutral-900">KYC</p>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
            {KYC_LABEL[kyc.status || "not_submitted"]}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1 text-xs text-neutral-600">
          {DOC_LINKS.map(([k, label]) => (
            <p key={k}>
              {label}:{" "}
              {docUrl(kyc[k]?.url) ? (
                <a className="text-amber-700 underline" href={kyc[k].url} target="_blank" rel="noreferrer">View</a>
              ) : (
                "Missing"
              )}
            </p>
          ))}
          <p>GST: {kyc.gst?.number || "Not provided"}</p>
          <p>
            Bank: {kyc.bank?.accountName ? `${kyc.bank.accountName} · ${kyc.bank.accountNumber} · ${kyc.bank.ifsc}` : "Missing"}
          </p>
          {kyc.status === "rejected" && kyc.rejectionReason && <p className="text-red-700">Reason: {kyc.rejectionReason}</p>}
        </div>

        {kyc.status === "submitted" && (
          <div className="space-y-2 pt-2">
            <textarea
              className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
              rows={2}
              placeholder="Reason (required to reject)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button className="flex-1" disabled={busy} onClick={() => decideKyc("verify")}>Verify</Button>
              <Button variant="outline" className="flex-1" disabled={busy || !reason.trim()} onClick={() => decideKyc("reject")}>Reject</Button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2 rounded-xl border border-neutral-200 p-4">
        <p className="text-sm font-bold text-neutral-900">Booking types</p>
        {[
          ["dedicatedEnabled", "Dedicated transport"],
          ["sharedEnabled", "Shared transport"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center justify-between text-sm text-neutral-700">
            {label}
            <input type="checkbox" className="h-4 w-4 accent-amber-600" disabled={busy} checked={controls[key]} onChange={() => toggle(key)} />
          </label>
        ))}
      </section>

      <section className="space-y-2 rounded-xl border border-neutral-200 p-4">
        <p className="text-sm font-bold text-neutral-900">Fleet ({fleet.vehicles.length} vehicles · {fleet.drivers.length} drivers)</p>
        {fleet.vehicles.length === 0 && fleet.drivers.length === 0 && <p className="text-xs text-neutral-500">No vehicles or drivers added yet.</p>}
        {fleet.vehicles.map((v) => (
          <p key={v._id} className="text-xs text-neutral-700">
            {v.registrationNumber} · {labelOf(v.vehicleType)} · {v.maxAnimals} animal(s) ·{" "}
            <span className={v.isAvailable ? "text-emerald-700" : "text-neutral-500"}>{v.isAvailable ? "Available" : "On trip"}</span>
          </p>
        ))}
        {fleet.drivers.map((d) => (
          <p key={d._id} className="text-xs text-neutral-700">
            {d.name} · {d.phone} · <span className={d.isAvailable ? "text-emerald-700" : "text-neutral-500"}>{d.isAvailable ? "Available" : "On trip"}</span>
          </p>
        ))}
      </section>
    </div>
  )
}
