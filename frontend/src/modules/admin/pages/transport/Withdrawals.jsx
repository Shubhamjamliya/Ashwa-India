import { useEffect, useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

const TABS = [
  { key: "requested", label: "Requested" },
  { key: "approved", label: "Approved" },
  { key: "paid", label: "Paid" },
  { key: "rejected", label: "Rejected" },
  { key: "", label: "All" },
]

const BADGE = {
  requested: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
}

export default function Withdrawals() {
  const [tab, setTab] = useState("requested")
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState("")

  const load = () => {
    setLoading(true)
    setError("")
    apiFetch(`/transporter-ops/admin/withdrawals${tab ? `?status=${tab}` : ""}`)
      .then((d) => setItems(d.withdrawals || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [tab])

  const decide = async (w, action) => {
    let note
    if (action === "reject") {
      note = window.prompt("Reason for rejecting this withdrawal?")
      if (!note) return
    }
    setBusyId(w._id)
    setError("")
    try {
      await apiFetch(`/transporter-ops/admin/withdrawals/${w._id}`, { method: "PATCH", body: { action, note } })
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Transporter withdrawals</h1>
          <p className="text-sm text-neutral-500">Approve, reject, then mark as paid once the bank transfer is done.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key || "all"}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${tab === t.key ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 border border-neutral-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-bold uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-4 py-3">Transporter</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Bank</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">No withdrawals here.</td></tr>
              ) : (
                items.map((w) => (
                  <tr key={w._id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-900">{w.transporter?.businessName || w.transporter?.name || "—"}</p>
                      <p className="text-xs text-neutral-500">{w.transporter?.phone}</p>
                    </td>
                    <td className="px-4 py-3 font-bold">{fmt(w.amount)}</td>
                    <td className="px-4 py-3 text-xs text-neutral-600">
                      {w.bankSnapshot?.accountName}<br />
                      {w.bankSnapshot?.accountNumber} · {w.bankSnapshot?.ifsc}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600">{new Date(w.createdAt).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${BADGE[w.status] || ""}`}>{w.status}</span>
                      {w.note && <p className="mt-1 text-xs text-neutral-500">{w.note}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {w.status === "requested" && (
                          <>
                            <Button size="sm" disabled={busyId === w._id} onClick={() => decide(w, "approve")}>Approve</Button>
                            <Button size="sm" variant="outline" disabled={busyId === w._id} onClick={() => decide(w, "reject")}>Reject</Button>
                          </>
                        )}
                        {w.status === "approved" && (
                          <Button size="sm" disabled={busyId === w._id} onClick={() => decide(w, "paid")}>Mark paid</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
