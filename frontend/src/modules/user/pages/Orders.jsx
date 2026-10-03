import { useEffect, useState } from "react"
import { Package } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import BackButton from "../components/BackButton"

const statusMeta = {
  pending: { label: "Pending", color: "#f59e0b" },
  processing: { label: "Processing", color: "#0ea5e9" },
  shipped: { label: "Shipped", color: "#0ea5e9" },
  delivered: { label: "Delivered", color: "#16a34a" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
  returned: { label: "Returned", color: "#ef4444" },
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch("/store/orders")
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <BackButton />
        <h1 className="text-xl font-bold text-[#0F2238]">Your Orders</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-8 py-20 text-center">
          <Package className="h-8 w-8 text-neutral-400" />
          <p className="text-base font-semibold text-[#0F2238]">No orders yet</p>
          <p className="text-[13px] text-neutral-500">Your accessories store orders will show up here once you place one.</p>
        </div>
      ) : (
        <div className="space-y-2.5 px-4">
          {orders.map((order) => {
            const meta = statusMeta[order.status] || statusMeta.pending
            return (
              <div key={order._id} className="space-y-1 rounded-2xl border border-[#E4E1D8] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-[#0F2238]">Order #{order._id.slice(-6).toUpperCase()}</p>
                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">{order.seller?.businessName || order.seller?.name}</p>
                {order.items.map((orderItem, idx) => (
                  <p key={idx} className="mt-1 text-[13px] text-[#0F2238]">
                    {orderItem.quantity} × {typeof orderItem.product === "object" ? orderItem.product.name : "Item"}
                  </p>
                ))}
                <p className="mt-1.5 text-sm font-extrabold text-[#C28D2E]">Total: ₹{order.total?.toLocaleString("en-IN")}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
