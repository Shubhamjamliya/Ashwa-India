import { useEffect, useState } from "react"
import { Percent, Wallet } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import BackButton from "../components/BackButton"

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

export default function Earnings() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/commissions/me")
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load earnings"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen pb-6">
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-4">
        <BackButton variant="dark" />
        <div>
          <h1 className="text-[18px] font-bold text-white">Earnings</h1>
          <p className="mt-0.5 text-xs text-[#A9B8CC]">What you earned after platform commission</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : error ? (
        <p className="px-8 py-16 text-center text-sm text-destructive">{error}</p>
      ) : (
        <div className="space-y-4 p-4">
          <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-[#C28D2E]" />
              <p className="text-sm font-bold text-[#0F2238]">Platform commission</p>
            </div>
            <p className="mt-1 text-[13px] text-neutral-600">
              {data.rule.active
                ? `${data.rule.percent}% of each booking${data.rule.fixedPerBooking ? ` + ${fmt(data.rule.fixedPerBooking)} fixed` : ""}`
                : "No commission is currently applied"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#0B1C33] p-3">
              <p className="text-[10px] uppercase tracking-wide text-[#A9B8CC]">Gross</p>
              <p className="mt-1 text-sm font-extrabold text-white">{fmt(data.totals.gross)}</p>
            </div>
            <div className="rounded-xl bg-[#F6E9C9] p-3">
              <p className="text-[10px] uppercase tracking-wide text-[#8A6416]">Commission</p>
              <p className="mt-1 text-sm font-extrabold text-[#8A6416]">{fmt(data.totals.commission)}</p>
            </div>
            <div className="rounded-xl bg-emerald-600 p-3">
              <p className="text-[10px] uppercase tracking-wide text-white/80">You earned</p>
              <p className="mt-1 text-sm font-extrabold text-white">{fmt(data.totals.net)}</p>
            </div>
          </div>

          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Settled trips</p>
          {data.settlements.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#D8D3C5] bg-white px-6 py-10 text-center">
              <Wallet className="h-6 w-6 text-neutral-400" />
              <p className="text-[13px] text-neutral-500">Completed trips will show their earnings here.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.settlements.map((s) => (
                <div key={s.id} className="rounded-2xl border border-[#E4E1D8] bg-white p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500">{fmtDate(s.settledAt)}</p>
                    <p className="text-sm font-extrabold text-emerald-700">+{fmt(s.net)}</p>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Booking {fmt(s.gross)} − commission {fmt(s.commission)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
