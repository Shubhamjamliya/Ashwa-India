import { useEffect, useState } from "react"
import { Loader2, Percent, Wallet } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

// What the seller earned on delivered store orders, after platform commission.
export default function StoreSellerEarnings() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/commissions/me")
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load earnings"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
  if (error) return <p className="p-8 text-sm text-destructive">{error}</p>

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Earnings</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">What you earned on delivered orders, after the platform commission. Credited to your wallet on delivery.</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-neutral-700">
          <Percent className="h-4 w-4 text-amber-700" />
          {data.rule.active
            ? `Commission: ${data.rule.percent}% of each order${data.rule.fixedPerBooking ? ` + ${fmt(data.rule.fixedPerBooking)} fixed` : ""}`
            : "No commission is currently applied"}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Order value", value: fmt(data.totals.gross) },
          { label: "Commission", value: fmt(data.totals.commission), highlight: true },
          { label: "You earned", value: fmt(data.totals.net) },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{c.label}</p>
            <p className={`mt-2 text-2xl font-bold ${c.highlight ? "text-amber-700" : "text-neutral-900"}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-3 text-sm font-semibold text-neutral-700">Settled orders</div>
        {data.settlements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <Wallet className="h-7 w-7 text-neutral-300" />
            <p className="text-sm text-neutral-500">Delivered orders will show their earnings here.</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                {["Date", "Order value", "Commission", "Earned"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.settlements.map((s) => (
                <tr key={s.id} className="text-sm">
                  <td className="px-5 py-3 text-xs text-neutral-500">{fmtDate(s.settledAt)}</td>
                  <td className="px-5 py-3">{fmt(s.gross)}</td>
                  <td className="px-5 py-3 text-amber-700">− {fmt(s.commission)}</td>
                  <td className="px-5 py-3 font-semibold text-emerald-700">{fmt(s.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
