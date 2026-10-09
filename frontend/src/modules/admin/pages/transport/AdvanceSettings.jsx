import { useEffect, useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"

// Advance the user pays when booking transport. The rest is paid at delivery.
// Refunded to the user's wallet if the booking is declined or cancelled.
export default function AdvanceSettings() {
  const [advanceType, setAdvanceType] = useState("percent")
  const [value, setValue] = useState("0")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    apiFetch("/admin/system-settings/transport")
      .then((d) => {
        setAdvanceType(d.transport?.advanceType || "percent")
        setValue(String(d.transport?.advanceValue ?? 0))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setNotice("")
    try {
      const d = await apiFetch("/admin/system-settings/transport", {
        method: "PUT",
        body: { advanceType, advanceValue: Number(value) },
      })
      setAdvanceType(d.transport.advanceType)
      setValue(String(d.transport.advanceValue))
      setNotice("Advance saved. New bookings use this amount.")
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const example = 5000
  const n = Number(value) || 0
  const exampleAdvance = Math.min(example, Math.round(advanceType === "fixed" ? n : (example * n) / 100))

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Advance Payment</h1>
          <p className="text-sm text-neutral-500">What users pay up front when they book transport.</p>
        </div>

        <form onSubmit={save} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">Advance type</label>
            <div className="flex gap-2">
              {[
                ["percent", "Percent of fare"],
                ["fixed", "Fixed amount"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  disabled={loading}
                  onClick={() => setAdvanceType(key)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                    advanceType === key ? "border-amber-600 bg-amber-50 text-amber-800" : "border-neutral-300 text-neutral-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-neutral-700">
              {advanceType === "percent" ? "Advance (%)" : "Advance (₹)"}
            </label>
            <div className="flex items-center gap-2">
              {advanceType === "fixed" && <span className="text-lg font-bold text-neutral-500">₹</span>}
              <input
                type="number"
                min="0"
                max={advanceType === "percent" ? 100 : undefined}
                step="1"
                value={value}
                disabled={loading}
                onChange={(e) => setValue(e.target.value)}
                className="h-11 w-40 rounded-lg border border-neutral-300 px-3 text-lg font-bold outline-none focus:border-amber-600"
              />
              {advanceType === "percent" && <span className="text-lg font-bold text-neutral-500">%</span>}
            </div>
            <p className="mt-2 text-xs text-neutral-500">Use 0 to book without an advance.</p>
          </div>

          <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
            Example: on a ₹{example.toLocaleString("en-IN")} trip the user pays <b>₹{exampleAdvance.toLocaleString("en-IN")}</b> now and ₹
            {(example - exampleAdvance).toLocaleString("en-IN")} at delivery. The advance is never more than the fare, and it goes back to
            the user's wallet if the booking is declined or cancelled.
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-emerald-700">{notice}</p>}

          <Button type="submit" disabled={saving || loading || value === ""}>
            {saving ? "Saving..." : "Save advance"}
          </Button>
        </form>
      </div>
    </div>
  )
}
