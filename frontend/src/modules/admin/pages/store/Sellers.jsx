import { useEffect, useState } from "react"
import { Building2, Check, X } from "lucide-react"
import { Card } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"

const tabs = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
]

const statusColor = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-neutral-200 text-neutral-700",
  archived: "bg-neutral-200 text-neutral-700",
}

export default function StoreSellers() {
  const [sellers, setSellers] = useState([])
  const [tab, setTab] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actingId, setActingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch(`/store/sellers${tab ? `?status=${tab}` : ""}`)
      setSellers(data.sellers)
    } catch (err) {
      setError(err.message || "Failed to load sellers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const updateStatus = async (id, status) => {
    setActingId(id)
    try {
      await apiFetch(`/store/sellers/${id}/status`, { method: "PATCH", body: { status } })
      await load()
    } catch (err) {
      setError(err.message || "Failed to update seller")
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="px-4 pb-10 lg:px-6 pt-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-neutral-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Store Sellers</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Approve or reject accessories store seller registrations</p>
          </div>
        </div>

        <div className="inline-flex p-1 bg-neutral-100 rounded-xl mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                tab === t.key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Name</th>
                  <th className="text-left font-semibold px-5 py-3">Business</th>
                  <th className="text-left font-semibold px-5 py-3">Phone</th>
                  <th className="text-left font-semibold px-5 py-3">Status</th>
                  <th className="text-right font-semibold px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sellers.map((s) => (
                  <tr key={s._id} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-neutral-900">{s.name || "—"}</td>
                    <td className="px-5 py-3 text-neutral-600">{s.businessName || "—"}</td>
                    <td className="px-5 py-3 text-neutral-600">{s.phone}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {s.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" disabled={actingId === s._id} onClick={() => updateStatus(s._id, "approved")}>
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" disabled={actingId === s._id} onClick={() => updateStatus(s._id, "rejected")}>
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && sellers.length === 0 && (
            <div className="text-center py-10 text-neutral-500">No sellers found.</div>
          )}
          {loading && <div className="text-center py-10 text-neutral-500">Loading...</div>}
        </Card>
      </div>
    </div>
  )
}
