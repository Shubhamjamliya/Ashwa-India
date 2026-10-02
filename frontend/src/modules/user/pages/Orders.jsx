import { useEffect, useState } from "react"
import { Package } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

const statusBadge = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  returned: "bg-neutral-100 text-neutral-600 border-neutral-200",
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch("/store/orders")
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-neutral-500">Loading orders...</p>

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white py-16 text-center">
        <Package className="mb-3 h-10 w-10 text-neutral-300" />
        <h2 className="text-lg font-bold text-[#0F2238]">No orders yet</h2>
        <p className="text-sm text-neutral-500">Your accessories store orders will show up here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-[#0F2238]">Your Orders</h1>
      {orders.map((order) => (
        <div key={order._id} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold text-neutral-500">#{order._id.slice(-6).toUpperCase()}</p>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusBadge[order.status] || ""}`}>
              {order.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            {order.items.map((i) => `${i.quantity} × ${i.product?.name || "Product"}`).join(", ")}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-neutral-500">{fmtDate(order.createdAt)}</p>
            <p className="text-sm font-extrabold text-[#0F2238]">{fmt(order.total)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
