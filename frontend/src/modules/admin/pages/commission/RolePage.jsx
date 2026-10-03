import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import RuleCard, { ROLE_META } from "./RuleCard"

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

export default function RolePage({ role }) {
  const meta = ROLE_META[role]
  const [rule, setRule] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    Promise.all([apiFetch("/commissions/rules"), apiFetch("/commissions/summary")])
      .then(([rulesRes, summaryRes]) => {
        setRule(rulesRes.rules.find((r) => r.role === role))
        setSummary(summaryRes)
      })
      .catch((err) => setError(err.message || "Failed to load commission settings"))
      .finally(() => setLoading(false))
  }, [role])

  const totals = summary?.[role]
  // The summary returns one combined recent list, so each page keeps only its own partner type.
  const recent = (summary?.recent || []).filter((row) => row.role === role)

  return (
    <div className="min-h-screen space-y-6 p-4 lg:p-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">{meta.label} commission</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Set the rule for {meta.label.toLowerCase()} and review the platform commission earned from them.
        </p>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      {loading || !rule || !totals ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : (
        <>
          <div className="max-w-2xl">
            <RuleCard rule={rule} onSaved={setRule} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Settled bookings", value: totals.count, raw: true },
              { label: "Gross booking value", value: totals.gross },
              { label: "Platform commission", value: totals.commission, highlight: true },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{card.label}</p>
                <p className={`mt-2 text-2xl font-bold ${card.highlight ? "text-amber-700" : "text-neutral-900"}`}>
                  {card.raw ? card.value : fmt(card.value)}
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-3">
              <p className="text-sm font-semibold text-neutral-700">Recent settlements</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    {["Date", "Partner", "Booking", "Gross", "Commission", "Paid out"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recent.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-sm text-neutral-500">
                        No settled bookings yet. Settlements appear here when a {role === "transporter" ? "trip" : "service"} is completed.
                      </td>
                    </tr>
                  ) : (
                    recent.map((row) => (
                      <tr key={row.id} className="text-sm">
                        <td className="px-5 py-3 text-xs text-neutral-500">{fmtDate(row.settledAt)}</td>
                        <td className="px-5 py-3 font-semibold text-neutral-900">{row.party}</td>
                        <td className="px-5 py-3 text-neutral-600">{row.kind}</td>
                        <td className="px-5 py-3">{fmt(row.gross)}</td>
                        <td className="px-5 py-3 font-semibold text-amber-700">{fmt(row.commission)}</td>
                        <td className="px-5 py-3">{fmt(row.net)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
