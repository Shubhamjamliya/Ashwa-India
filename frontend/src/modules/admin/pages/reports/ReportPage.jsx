import { useEffect, useMemo, useState } from "react"
import { Download, Search } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { exportCSV, exportExcel, exportJSON, exportPDF } from "@/shared/lib/reportExport"

// One screen for every admin report. The page is driven by `type` (the API report name).
const RANGES = ["Today", "This week", "This month", "All time", "Custom"]

// Start and end of the chosen range, as ISO strings. All time means no filter.
function rangeDates(range, customFrom, customTo) {
  const now = new Date()
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (range === "Today") return { from: startOfDay(now).toISOString(), to: now.toISOString() }
  if (range === "This week") {
    const start = startOfDay(now)
    start.setDate(start.getDate() - start.getDay())
    return { from: start.toISOString(), to: now.toISOString() }
  }
  if (range === "This month") return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to: now.toISOString() }
  if (range === "Custom") {
    return {
      from: customFrom ? new Date(customFrom).toISOString() : undefined,
      to: customTo ? new Date(`${customTo}T23:59:59`).toISOString() : undefined,
    }
  }
  return {}
}

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
const formatValue = (value, format) => {
  if (format === "money") return money(value)
  if (format === "number") return Number(value || 0).toLocaleString("en-IN")
  if (format === "date") return value ? new Date(value).toLocaleString("en-IN") : "—"
  return value ?? "—"
}

export default function ReportPage({ type, title }) {
  const [range, setRange] = useState("This month")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [query, setQuery] = useState("")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    if (range === "Custom" && (!customFrom || !customTo)) return
    const { from, to } = rangeDates(range, customFrom, customTo)
    const params = new URLSearchParams()
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    setLoading(true)
    setError("")
    apiFetch(`/reports/${type}${params.toString() ? `?${params}` : ""}`)
      .then(setData)
      .catch((err) => setError(err.message || "Could not load this report"))
      .finally(() => setLoading(false))
  }, [type, range, customFrom, customTo])

  const rows = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    if (!q) return data.rows
    return data.rows.filter((r) => data.columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q)))
  }, [data, query])

  const runExport = (format) => {
    setExportOpen(false)
    if (!data) return
    const name = type
    if (format === "csv") exportCSV(name, data.columns, rows)
    if (format === "excel") exportExcel(name, data.columns, rows)
    if (format === "json") exportJSON(name, rows)
    if (format === "pdf") exportPDF(title, data.summary, data.columns, rows)
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
            <p className="text-sm text-neutral-500">Pick a period, search, and export.</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              disabled={!data}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export
            </button>
            {exportOpen && (
              <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                {[["csv", "CSV"], ["excel", "Excel"], ["pdf", "PDF (print)"], ["json", "JSON"]].map(([key, label]) => (
                  <button key={key} onClick={() => runExport(key)} className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50">
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white p-3">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${range === r ? "bg-neutral-900 text-white" : "border border-neutral-200 text-neutral-600"}`}
            >
              {r}
            </button>
          ))}
          {range === "Custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-9 rounded-lg border border-neutral-300 px-2 text-sm" />
              <span className="text-xs text-neutral-500">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-9 rounded-lg border border-neutral-300 px-2 text-sm" />
            </div>
          )}
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rows"
              className="h-9 w-56 rounded-lg border border-neutral-300 pl-8 pr-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && !data && <p className="text-sm text-neutral-500">Loading report...</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {data.summary.map((s) => (
                <div key={s.label} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{s.label}</p>
                  <p className="mt-1 truncate text-xl font-extrabold text-neutral-900">{formatValue(s.value, s.format)}</p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs font-bold uppercase tracking-wide text-neutral-600">
                  <tr>
                    {data.columns.map((c) => (
                      <th key={c.key} className={`px-4 py-3 ${c.format === "money" || c.format === "number" ? "text-right" : ""}`}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={data.columns.length} className="px-4 py-10 text-center text-neutral-500">No rows for this period.</td></tr>
                  ) : (
                    rows.map((r, i) => (
                      <tr key={i} className="border-t border-neutral-100">
                        {data.columns.map((c) => (
                          <td key={c.key} className={`px-4 py-2.5 ${c.format === "money" || c.format === "number" ? "text-right font-medium" : "text-neutral-700"}`}>
                            {formatValue(r[c.key], c.format)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-500">{rows.length} row{rows.length === 1 ? "" : "s"}</p>
          </>
        )}
      </div>
    </div>
  )
}
