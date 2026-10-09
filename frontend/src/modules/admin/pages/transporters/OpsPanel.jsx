import { useEffect, useState } from "react"
import { BadgeCheck, ExternalLink, FileText, Truck, UserRound, XCircle } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Switch } from "@/shared/components/ui/switch"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useVehicleTypes } from "@/shared/lib/vehicleTypes"

const KYC_LABEL = {
  not_submitted: { label: "Not submitted", className: "bg-neutral-100 text-neutral-700" },
  submitted: { label: "Waiting for review", className: "bg-amber-100 text-amber-800" },
  verified: { label: "Verified", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
}

const DOC_LINKS = [
  ["identityProof", "Identity proof"],
  ["businessLicense", "Business licence"],
]

const isImage = (url) => /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url || "") || /cloudinary|\/uploads\//.test(url || "")

function Section({ title, aside, children }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-neutral-900">{title}</p>
        {aside}
      </div>
      {children}
    </section>
  )
}

// Admin-side KYC review, dedicated/shared switches and fleet view for one transporter.
// Rendered inside the transporter details dialog.
export default function OpsPanel({ transporter, onChanged }) {
  const { labelOf } = useVehicleTypes()
  const [kyc, setKyc] = useState(transporter.kyc || {})
  const [controls, setControls] = useState({
    dedicatedEnabled: transporter.dedicatedEnabled !== false,
    sharedEnabled: transporter.sharedEnabled !== false,
  })
  const [fleet, setFleet] = useState(null)
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
    setFleet(null)
    apiFetch(`/transporter-ops/admin/transporters/${transporter._id}/fleet`)
      .then(setFleet)
      .catch((err) => {
        setFleet({ vehicles: [], drivers: [] })
        setError(err.message)
      })
  }, [transporter._id])

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

  const kycMeta = KYC_LABEL[kyc.status || "not_submitted"]
  const vehicles = fleet?.vehicles || []
  const drivers = fleet?.drivers || []

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}

      <Section
        title="KYC documents"
        aside={<span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${kycMeta.className}`}>{kycMeta.label}</span>}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {DOC_LINKS.map(([k, label]) => {
            const url = getMediaUrl(kyc[k]?.url)
            return (
              <div key={k} className="rounded-lg border border-neutral-200 p-2.5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className="group block">
                    {isImage(kyc[k].url) ? (
                      <img src={url} alt={label} className="h-28 w-full rounded-md bg-neutral-100 object-cover" />
                    ) : (
                      <span className="flex h-28 items-center justify-center rounded-md bg-neutral-100">
                        <FileText className="h-8 w-8 text-neutral-400" />
                      </span>
                    )}
                    <span className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-amber-700 group-hover:underline">
                      Open full size <ExternalLink className="h-3 w-3" />
                    </span>
                  </a>
                ) : (
                  <p className="flex h-28 items-center justify-center rounded-md bg-neutral-50 text-xs text-neutral-400">Not uploaded</p>
                )}
              </div>
            )
          })}
        </div>

        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">GST number</dt>
            <dd className="font-medium text-neutral-900">{kyc.gst?.number || "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Bank account</dt>
            <dd className="font-medium text-neutral-900">
              {kyc.bank?.accountName ? (
                <>
                  {kyc.bank.accountName}
                  <span className="block text-xs font-normal text-neutral-500">
                    {kyc.bank.accountNumber} · {kyc.bank.ifsc}
                    {kyc.bank.bankName ? ` · ${kyc.bank.bankName}` : ""}
                  </span>
                </>
              ) : (
                "Missing"
              )}
            </dd>
          </div>
        </dl>

        {kyc.status === "rejected" && kyc.rejectionReason && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Rejected: {kyc.rejectionReason}</p>
        )}

        {kyc.status === "submitted" && (
          <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
            <textarea
              className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm outline-none focus:border-neutral-500"
              rows={2}
              placeholder="Reason (required to reject)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" disabled={busy || !reason.trim()} onClick={() => decideKyc("reject")}>
                <XCircle className="h-4 w-4" /> Reject KYC
              </Button>
              <Button className="flex-1" disabled={busy} onClick={() => decideKyc("verify")}>
                <BadgeCheck className="h-4 w-4" /> Verify KYC
              </Button>
            </div>
          </div>
        )}
      </Section>

      <Section title="Booking types">
        <div className="divide-y divide-neutral-100">
          {[
            ["dedicatedEnabled", "Dedicated transport", "Customers can book a private vehicle from this transporter"],
            ["sharedEnabled", "Shared transport", "This transporter can carry customers who share a ride"],
          ].map(([key, label, hint]) => (
            <label key={key} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <span>
                <span className="block text-sm font-semibold text-neutral-900">{label}</span>
                <span className="block text-xs text-neutral-500">{hint}</span>
              </span>
              <Switch checked={controls[key]} disabled={busy} onCheckedChange={() => toggle(key)} aria-label={label} />
            </label>
          ))}
        </div>
      </Section>

      <Section
        title="Fleet"
        aside={
          <span className="text-xs font-medium text-neutral-500">
            {fleet ? `${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"} · ${drivers.length} driver${drivers.length === 1 ? "" : "s"}` : "Loading..."}
          </span>
        }
      >
        {!fleet ? (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
          </div>
        ) : vehicles.length === 0 && drivers.length === 0 ? (
          <p className="text-sm text-neutral-500">No vehicles or drivers added yet.</p>
        ) : (
          <div className="space-y-3">
            {vehicles.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {vehicles.map((v) => (
                  <li key={v._id} className="flex items-center gap-3 rounded-lg border border-neutral-200 p-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                      <Truck className="h-5 w-5 text-neutral-500" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-neutral-900">{v.registrationNumber}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {labelOf(v.vehicleType)} · {v.maxAnimals} horse{v.maxAnimals === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${v.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"}`}>
                      {v.isAvailable ? "Available" : "On trip"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {drivers.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {drivers.map((d) => (
                  <li key={d._id} className="flex items-center gap-3 rounded-lg border border-neutral-200 p-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                      <UserRound className="h-5 w-5 text-neutral-500" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-neutral-900">{d.name}</p>
                      <p className="truncate text-xs text-neutral-500">{d.phone}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${d.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"}`}>
                      {d.isAvailable ? "Available" : "On trip"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Section>
    </div>
  )
}
