import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, Check, Loader2, MapPin, Package, Phone, ShoppingBag, X } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getSocket } from "@/shared/lib/socket"

const INR = "₹"
const fmt = (n) => `${INR}${Number(n || 0).toLocaleString("en-IN")}`
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

const tabs = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Accepted" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Rejected" },
]

const statusLabel = {
  pending: "Pending",
  processing: "Accepted",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Rejected",
  returned: "Returned",
}

const statusBadgeClass = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  returned: "bg-neutral-100 text-neutral-600 border-neutral-200",
}

export default function SellerStoreOrders() {
  const [orders, setOrders] = useState([])
  const [statusTab, setStatusTab] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [actingId, setActingId] = useState(null)
  const [newOrderAlert, setNewOrderAlert] = useState(null)
  const audioCtxRef = useRef(null)

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await apiFetch("/store/orders")
      setOrders(res.orders || [])
    } catch (err) {
      setError(err.message || "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const playChime = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      const ctx = audioCtxRef.current || new Ctx()
      audioCtxRef.current = ctx
      const now = ctx.currentTime
      ;[880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.0001, now + i * 0.15)
        gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.15 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.15)
        osc.stop(now + i * 0.15 + 0.3)
      })
    } catch {
      // ignore audio failures
    }
  }

  useEffect(() => {
    const socket = getSocket()
    // The socket only carries { orderId } — fetch the full, populated order before showing it.
    const handleNewOrder = async ({ orderId } = {}) => {
      if (!orderId) return
      try {
        const res = await apiFetch("/store/orders")
        const freshOrders = res.orders || []
        setOrders(freshOrders)
        const order = freshOrders.find((o) => o._id === orderId)
        if (order) {
          setNewOrderAlert(order)
          playChime()
        }
      } catch {
        // Best-effort — the seller still sees the new order on next manual refresh.
      }
    }
    socket.on("order:new", handleNewOrder)
    return () => {
      socket.off("order:new", handleNewOrder)
    }
  }, [])

  const filteredOrders = useMemo(() => {
    if (!statusTab) return orders
    return orders.filter((o) => o.status === statusTab)
  }, [orders, statusTab])

  const closePanel = () => setSelectedOrder(null)

  const updateStatus = async (order, status) => {
    const body = { status }
    if (status === "shipped") {
      // Shoppers follow their parcel with these details.
      const courierName = window.prompt("Courier name (e.g. Delhivery, DTDC)", order.courier?.name || "")
      if (courierName === null) return
      const trackingNumber = window.prompt("Tracking number", order.courier?.trackingNumber || "")
      if (trackingNumber === null) return
      body.courierName = courierName.trim()
      body.trackingNumber = trackingNumber.trim()
    }
    setActingId(order._id)
    try {
      const res = await apiFetch(`/store/orders/${order._id}/status`, { method: "PATCH", body })
      setOrders((prev) => prev.map((o) => (o._id === order._id ? res.order : o)))
      setSelectedOrder((prev) => (prev && prev._id === order._id ? res.order : prev))
    } catch (err) {
      setError(err.message || "Failed to update order")
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Orders</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500">
              Accept or reject incoming orders. Accepting moves the order to processing; rejecting restocks the items.
            </p>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-neutral-200 p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusTab(t.key)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${
                  statusTab === t.key ? "bg-neutral-900 text-white" : "text-neutral-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="w-[18%] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Order</th>
                <th className="w-[20%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Buyer</th>
                <th className="w-[24%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Items</th>
                <th className="w-[12%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Total</th>
                <th className="w-[12%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-neutral-600">Status</th>
                <th className="w-[14%] px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-neutral-500">Loading orders...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <ShoppingBag className="mx-auto h-8 w-8 text-neutral-300" />
                    <p className="mt-2 text-lg font-semibold text-neutral-700">No orders found</p>
                    <p className="mt-1 text-sm text-neutral-500">Orders placed by buyers will show up here.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="cursor-pointer align-top hover:bg-neutral-50/80"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-5 py-5">
                      <p className="font-mono text-xs font-semibold text-neutral-900">#{(order._id || "").slice(-6).toUpperCase() || "—"}</p>
                      <p className="mt-1 text-xs text-neutral-500">{fmtDate(order.createdAt)}</p>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-sm font-semibold text-neutral-900">{order.buyer?.name || "User"}</p>
                      <p className="text-xs text-neutral-500">{order.buyer?.phone}</p>
                    </td>
                    <td className="px-4 py-5 text-sm text-neutral-600">
                      {(order.items || [])
                        .map((i) => `${i.quantity} × ${i.product?.name || "Product"}`)
                        .join(", ")}
                    </td>
                    <td className="px-4 py-5 text-sm font-semibold text-neutral-900">{fmt(order.total)}</td>
                    <td className="px-4 py-5 text-center">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass[order.status]}`}>
                        {statusLabel[order.status]}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      {order.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => updateStatus(order, "processing")}
                            disabled={actingId === order._id}
                            className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => updateStatus(order, "cancelled")}
                            disabled={actingId === order._id}
                            className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrder(order)
                            }}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            View
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedOrder && (
              <div className="fixed inset-0 z-[200]">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50"
                  onClick={closePanel}
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "tween", duration: 0.25 }}
                  className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900">
                        Order #{(selectedOrder._id || "").slice(-6).toUpperCase() || "—"}
                      </h2>
                      <p className="text-xs text-neutral-500">{fmtDate(selectedOrder.createdAt)}</p>
                    </div>
                    <button onClick={closePanel} className="rounded-lg p-1 hover:bg-neutral-100">
                      <X className="h-5 w-5 text-neutral-500" />
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass[selectedOrder.status]}`}>
                        {statusLabel[selectedOrder.status]}
                      </span>
                      <span className="text-xs text-neutral-500">
                        Payment: {selectedOrder.paymentStatus === "paid" ? "Paid" : "Pending"}
                      </span>
                    </div>

                    <div>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Buyer</h3>
                      <div className="rounded-xl border border-neutral-200 p-4">
                        <p className="text-sm font-semibold text-neutral-900">{selectedOrder.buyer?.name || "User"}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
                          <Phone className="h-3.5 w-3.5" />
                          {selectedOrder.buyer?.phone}
                        </div>
                      </div>
                    </div>

                    {selectedOrder.shippingAddress && (
                      <div>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
                          Shipping Address
                        </h3>
                        <div className="rounded-xl border border-neutral-200 p-4">
                          <p className="text-sm font-semibold text-neutral-900">
                            {selectedOrder.shippingAddress.label || "Address"}
                          </p>
                          <div className="mt-1 flex items-start gap-1.5 text-sm text-neutral-600">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>
                              {[
                                selectedOrder.shippingAddress.line1,
                                selectedOrder.shippingAddress.city,
                                selectedOrder.shippingAddress.state,
                                selectedOrder.shippingAddress.pincode,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                          {selectedOrder.shippingAddress.phone && (
                            <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
                              <Phone className="h-3.5 w-3.5" />
                              {selectedOrder.shippingAddress.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Items</h3>
                      <div className="space-y-2 rounded-xl border border-neutral-200 p-4">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Package className="h-4 w-4 shrink-0 text-neutral-400" />
                              <span className="truncate text-sm text-neutral-700">
                                {item.product?.name || "Product"} × {item.quantity}
                              </span>
                            </div>
                            <span className="shrink-0 text-sm font-semibold text-neutral-900">
                              {fmt(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between border-t border-neutral-200 pt-2">
                          <span className="text-sm font-bold text-neutral-900">Total</span>
                          <span className="text-sm font-bold text-neutral-900">{fmt(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.status === "pending" && (
                    <div className="flex items-center gap-3 border-t bg-white px-6 py-4">
                      <button
                        onClick={() => updateStatus(selectedOrder, "cancelled")}
                        disabled={actingId === selectedOrder._id}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => updateStatus(selectedOrder, "processing")}
                        disabled={actingId === selectedOrder._id}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                      >
                        {actingId === selectedOrder._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Accept
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {newOrderAlert && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60"
                  onClick={() => setNewOrderAlert(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
                >
                  <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-primary/10 to-white px-6 pt-8 pb-5 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white animate-bounce">
                      <Bell className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-bold text-neutral-900">New Order Received!</h2>
                    <p className="text-sm text-neutral-500">
                      From {newOrderAlert.buyer?.name || "a buyer"} · {fmtDate(newOrderAlert.createdAt)}
                    </p>
                  </div>

                  <div className="space-y-2 px-6 py-4">
                    {(newOrderAlert.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">
                          {item.quantity} × {item.product?.name || "Product"}
                        </span>
                        <span className="font-semibold text-neutral-900">{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-neutral-100 pt-2">
                      <span className="text-sm font-bold text-neutral-900">Total</span>
                      <span className="text-sm font-bold text-primary">{fmt(newOrderAlert.total)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t px-6 py-4">
                    <button
                      onClick={() => {
                        updateStatus(newOrderAlert, "cancelled")
                        setNewOrderAlert(null)
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        updateStatus(newOrderAlert, "processing")
                        setNewOrderAlert(null)
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90"
                    >
                      <Check className="h-4 w-4" />
                      Accept
                    </button>
                  </div>
                  <button
                    onClick={() => setNewOrderAlert(null)}
                    className="absolute right-3 top-3 rounded-full bg-white/70 p-1.5 hover:bg-white"
                  >
                    <X className="h-4 w-4 text-neutral-500" />
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
