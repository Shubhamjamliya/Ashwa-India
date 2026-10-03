import { useState } from "react"
import { Loader2, Save, Truck, Stethoscope } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`

export const ROLE_META = {
  transporter: { label: "Transporters", hint: "Applied to every completed transport booking.", icon: Truck },
  provider: { label: "Service Providers", hint: "Applied to every completed service booking.", icon: Stethoscope },
}

export default function RuleCard({ rule, onSaved }) {
  const meta = ROLE_META[rule.role]
  const Icon = meta.icon
  const [percent, setPercent] = useState(String(rule.percent))
  const [fixed, setFixed] = useState(String(rule.fixedPerBooking))
  const [active, setActive] = useState(rule.active)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const dirty = Number(percent) !== rule.percent || Number(fixed) !== rule.fixedPerBooking || active !== rule.active

  const sample = 1000
  const commissionSample = active ? Math.min(sample, Math.round((sample * Number(percent || 0)) / 100 + Number(fixed || 0))) : 0

  const save = async () => {
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      const data = await apiFetch(`/commissions/rules/${rule.role}`, {
        method: "PUT",
        body: { percent: Number(percent), fixedPerBooking: Number(fixed), active },
      })
      onSaved(data.rule)
      setSaved(true)
    } catch (err) {
      setError(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <Icon className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <p className="text-base font-bold text-neutral-900">Commission rule</p>
            <p className="text-xs text-neutral-500">{meta.hint}</p>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-600">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-amber-600" />
          Active
        </label>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Commission (% of booking)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-300 px-3 pr-8 text-sm outline-none focus:border-amber-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">%</span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-700">Fixed fee per booking (₹)</label>
          <input
            type="number"
            min="0"
            value={fixed}
            onChange={(e) => setFixed(e.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        Example: on a {fmt(sample)} booking the platform keeps <span className="font-bold text-neutral-800">{fmt(commissionSample)}</span> and the
        partner receives <span className="font-bold text-neutral-800">{fmt(sample - commissionSample)}</span>.
      </p>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-emerald-600">{saved && !dirty ? "Saved" : ""}</span>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save rule
        </button>
      </div>
    </div>
  )
}
