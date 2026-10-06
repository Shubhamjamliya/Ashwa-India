import { useEffect, useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"

// GST charged to customers on accessories-store orders. The rate is added at checkout,
// shown on the cart and invoice, and saved on each order.
export default function TaxSettings() {
  const [percent, setPercent] = useState("0")
  const [saved, setSaved] = useState("0")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    apiFetch("/store/tax", { auth: false })
      .then((d) => {
        setPercent(String(d.gstPercent))
        setSaved(String(d.gstPercent))
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
      const d = await apiFetch("/store/tax", { method: "PUT", body: { gstPercent: Number(percent) } })
      setSaved(String(d.gstPercent))
      setPercent(String(d.gstPercent))
      setNotice("GST rate saved. New orders use this rate.")
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const example = 1000
  const gstOnExample = Math.round(((example * (Number(percent) || 0)) / 100) * 100) / 100

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tax / GST</h1>
          <p className="text-sm text-neutral-500">GST added to accessories-store orders at checkout.</p>
        </div>

        <form onSubmit={save} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-neutral-700">GST rate (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={percent}
                disabled={loading}
                onChange={(e) => setPercent(e.target.value)}
                className="h-11 w-40 rounded-lg border border-neutral-300 px-3 text-lg font-bold outline-none focus:border-amber-600"
              />
              <span className="text-lg font-bold text-neutral-500">%</span>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Currently saved: <b>{saved}%</b>. Use 0 to turn GST off.
            </p>
          </div>

          <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
            Example: a ₹{example.toLocaleString("en-IN")} cart pays GST of <b>₹{gstOnExample.toFixed(2)}</b>, so the customer pays ₹{(example + gstOnExample).toFixed(2)}.
            GST is charged after any coupon discount.
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-emerald-700">{notice}</p>}

          <Button type="submit" disabled={saving || loading || percent === ""}>
            {saving ? "Saving..." : "Save GST rate"}
          </Button>
        </form>
      </div>
    </div>
  )
}
