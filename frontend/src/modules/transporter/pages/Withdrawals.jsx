import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { apiFetch } from "@/shared/lib/api"
import BackButton from "../components/BackButton"

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

const STATUS = {
  requested: { label: "Requested", cls: "bg-amber-100 text-amber-800" },
  approved: { label: "Approved", cls: "bg-blue-100 text-blue-800" },
  paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Rejected", cls: "bg-rose-100 text-rose-800" },
}

export default function Withdrawals() {
  const [balance, setBalance] = useState(null)
  const [kycStatus, setKycStatus] = useState("not_submitted")
  const [list, setList] = useState([])
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState("")

  const load = () =>
    Promise.allSettled([apiFetch("/payments/wallet"), apiFetch("/transporter-ops/kyc"), apiFetch("/transporter-ops/withdrawals/mine")]).then(([w, k, l]) => {
      if (w.status === "fulfilled") setBalance(w.value.wallet?.balance ?? w.value.balance ?? 0)
      if (k.status === "fulfilled") setKycStatus(k.value.kyc?.status || "not_submitted")
      if (l.status === "fulfilled") setList(l.value.withdrawals || [])
    })

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const verified = kycStatus === "verified"

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setDone("")
    try {
      const d = await apiFetch("/transporter-ops/withdrawals", { method: "POST", body: { amount: Number(amount) } })
      setList((prev) => [d.withdrawal, ...prev])
      setAmount("")
      setDone("Withdrawal requested. Admin will process it to your bank account.")
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <BackButton variant="dark" />
        <div>
          <h1 className="text-[18px] font-bold text-white">Withdrawals</h1>
          <p className="text-xs text-[#A9B8CC]">Move wallet earnings to your bank</p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-neutral-500">Available balance</p>
          <p className="text-2xl font-extrabold text-[#0F2238]">{loading ? "—" : fmt(balance)}</p>
        </div>

        {!verified ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Complete KYC verification before requesting a withdrawal.
            <Link to="/transporter/kyc" className="ml-1 font-bold underline">Go to KYC</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <label className="block text-xs font-semibold text-neutral-700">Amount (₹)</label>
            <input
              inputMode="decimal"
              className="h-11 w-full rounded-lg border border-[#E4E1D8] px-3 text-sm outline-none focus:border-[#C28D2E]"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="Enter amount"
            />
            <button type="submit" disabled={saving || !amount || Number(amount) <= 0} className="w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? "Requesting..." : "Request withdrawal"}
            </button>
          </form>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
        {done && <p className="text-xs text-emerald-700">{done}</p>}

        <div>
          <p className="mb-2 text-sm font-bold text-[#0F2238]">History</p>
          {list.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-500">No withdrawals yet.</p>
          ) : (
            <div className="space-y-2">
              {list.map((w) => {
                const s = STATUS[w.status] || STATUS.requested
                return (
                  <div key={w._id} className="flex items-center justify-between rounded-xl border border-[#E4E1D8] bg-white p-3">
                    <div>
                      <p className="text-sm font-bold text-[#0F2238]">{fmt(w.amount)}</p>
                      <p className="text-[11px] text-neutral-500">{new Date(w.createdAt).toLocaleDateString("en-IN")}{w.note ? ` · ${w.note}` : ""}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
