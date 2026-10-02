import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock, CreditCard, Loader2, Wallet, XCircle } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

const INR = "₹"
const fmt = (n) => `${INR}${Number(n || 0).toLocaleString("en-IN")}`
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

const paymentStatusMeta = {
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
}

const tabs = [
  { key: "", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
]

export default function StoreSellerPayments() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusTab, setStatusTab] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/store/orders")
      setOrders(data.orders || [])
    } catch (err) {
      setError(err.message || "Failed to load payments")
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    const paid = orders.filter((o) => o.paymentStatus === "paid")
    const pending = orders.filter((o) => o.paymentStatus === "pending")
    const failed = orders.filter((o) => o.paymentStatus === "failed")
    // Cancelled/returned orders don't count toward settled revenue even if marked paid.
    const settled = paid.filter((o) => !["cancelled", "returned"].includes(o.status))
    return {
      totalRevenue: settled.reduce((sum, o) => sum + o.total, 0),
      paidCount: paid.length,
      pendingAmount: pending.reduce((sum, o) => sum + o.total, 0),
      pendingCount: pending.length,
      failedCount: failed.length,
    }
  }, [orders])

  const filteredOrders = statusTab ? orders.filter((o) => o.paymentStatus === statusTab) : orders

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Payments</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Earnings and payment status for orders placed on your store.
        </p>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Total Revenue</p>
              <p className="text-xl font-bold text-neutral-900">{fmt(summary.totalRevenue)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-neutral-500">From {summary.paidCount} paid order{summary.paidCount === 1 ? "" : "s"}</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Pending Payments</p>
              <p className="text-xl font-bold text-neutral-900">{fmt(summary.pendingAmount)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-neutral-500">{summary.pendingCount} order{summary.pendingCount === 1 ? "" : "s"} awaiting payment</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
              <XCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Failed Payments</p>
              <p className="text-xl font-bold text-neutral-900">{summary.failedCount}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Payments that didn't go through</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-neutral-50 px-5 py-3">
          <p className="text-sm font-medium text-neutral-700">Transactions</p>
          <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-neutral-200 bg-white p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusTab(t.key)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                  statusTab === t.key ? "bg-neutral-900 text-white" : "text-neutral-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="w-[18%] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Order</th>
                <th className="w-[22%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Buyer</th>
                <th className="w-[16%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Amount</th>
                <th className="w-[20%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Payment Ref</th>
                <th className="w-[12%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-neutral-600">Status</th>
                <th className="w-[12%] px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-neutral-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-neutral-500">Loading payments...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <CreditCard className="mx-auto h-8 w-8 text-neutral-300" />
                    <p className="mt-2 text-lg font-semibold text-neutral-700">No payments found</p>
                    <p className="mt-1 text-sm text-neutral-500">Payments for orders will show up here.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const meta = paymentStatusMeta[order.paymentStatus] || paymentStatusMeta.pending
                  const StatusIcon = meta.icon
                  return (
                    <tr key={order._id} className="align-top hover:bg-neutral-50/80">
                      <td className="px-5 py-5">
                        <p className="font-mono text-xs font-semibold text-neutral-900">#{order._id.slice(-6).toUpperCase()}</p>
                      </td>
                      <td className="px-4 py-5">
                        <p className="text-sm font-semibold text-neutral-900">{order.buyer?.name || "User"}</p>
                        <p className="text-xs text-neutral-500">{order.buyer?.phone}</p>
                      </td>
                      <td className="px-4 py-5 text-sm font-semibold text-neutral-900">{fmt(order.total)}</td>
                      <td className="px-4 py-5 text-xs text-neutral-500">
                        {order.paymentIntent?.razorpay?.paymentId ? (
                          <span className="font-mono">{order.paymentIntent.razorpay.paymentId}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-5 text-right text-xs text-neutral-500">{fmtDate(order.createdAt)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
