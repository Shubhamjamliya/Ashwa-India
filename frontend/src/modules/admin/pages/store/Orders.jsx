import { useState, useEffect, useMemo } from "react"
import {
  Search, Download, Eye, ShoppingBag, Calendar as CalendarIcon, User, Store,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { apiFetch } from "@/shared/lib/api"
import { exportToCSV } from "@/shared/lib/csvExport"

const INR = "₹"
const fmt = (n) => `${INR}${Number(n || 0).toLocaleString("en-IN")}`

const statuses = ["pending", "processing", "shipped", "delivered", "cancelled", "returned"]
const statusBadgeClass = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-neutral-200 text-neutral-700",
}

function formatDateTime(value) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const day = String(d.getDate()).padStart(2, "0")
  const month = d.toLocaleString("en-GB", { month: "short" })
  const year = d.getFullYear()
  const time = d.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })
  return `${day} ${month} ${year}, ${time}`
}

export default function StoreOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusTab, setStatusTab] = useState("")
  const [selected, setSelected] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [actingId, setActingId] = useState(null)

  const tabs = [{ key: "", label: "All" }, ...statuses.map((s) => ({ key: s, label: s[0].toUpperCase() + s.slice(1) }))]

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/store/orders")
      setOrders(data.orders)
    } catch (err) {
      setError(err.message || "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let result = statusTab ? orders.filter((o) => o.status === statusTab) : orders
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (o) =>
          o._id.toLowerCase().includes(q) ||
          o.buyer?.name?.toLowerCase().includes(q) ||
          o.seller?.businessName?.toLowerCase().includes(q)
      )
    }
    return result
  }, [orders, statusTab, searchQuery])

  const updateStatus = async (id, status) => {
    setActingId(id)
    try {
      await apiFetch(`/store/orders/${id}/status`, { method: "PATCH", body: { status } })
      await load()
    } catch (err) {
      setError(err.message || "Failed to update order")
    } finally {
      setActingId(null)
    }
  }

  const handleViewDetails = (order) => {
    setSelected(order)
    setShowDetails(true)
  }

  const handleExport = () => {
    exportToCSV(
      filtered.map((o) => ({
        id: o._id,
        buyerName: o.buyer?.name || "",
        sellerName: o.seller?.businessName || o.seller?.name || "",
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
      [
        { key: "id", label: "Order ID" },
        { key: "buyerName", label: "Buyer" },
        { key: "sellerName", label: "Seller" },
        { key: "total", label: "Total" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Placed On" },
      ],
      "store-orders"
    )
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-neutral-900">Store orders</h2>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-neutral-100 text-neutral-700">
                {filtered.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by order id, buyer, seller"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-2.5 text-sm font-medium rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="inline-flex flex-wrap p-1 bg-neutral-100 rounded-xl mb-4 gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusTab(t.key)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  statusTab === t.key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-destructive mb-3">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Sl</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Buyer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Placed On</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100">
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-neutral-500">Loading orders...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-neutral-500">No orders found</td></tr>
                ) : (
                  filtered.map((order, index) => (
                    <tr key={order._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-neutral-700">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-mono text-neutral-500">{order._id.slice(-8)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-700">{order.buyer?.name || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-700">{order.seller?.businessName || order.seller?.name || "—"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-neutral-900">{fmt(order.total)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          disabled={actingId === order._id}
                          onChange={(e) => updateStatus(order._id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-full capitalize border-0 focus:outline-none focus:ring-2 focus:ring-primary/40 ${statusBadgeClass[order.status]}`}
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-700">{formatDateTime(order.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="p-1.5 rounded text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg mx-auto p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-200">
            <DialogTitle className="pr-12 text-xl font-bold text-neutral-900">Order Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 px-6 py-5">
              <div className="bg-neutral-50 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-neutral-200 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-6 h-6 text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-neutral-500">{selected._id}</p>
                    <p className="text-lg font-bold text-primary">{fmt(selected.total)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusBadgeClass[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <User className="w-4 h-4" />
                  <span>Buyer: {selected.buyer?.name || "—"} ({selected.buyer?.phone})</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Store className="w-4 h-4" />
                  <span>Seller: {selected.seller?.businessName || selected.seller?.name || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Placed: {formatDateTime(selected.createdAt)}</span>
                </div>
              </div>

              {selected.items?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 mb-2">Items</h4>
                  <div className="space-y-2">
                    {selected.items.map((item, i) => (
                      <div key={i} className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{item.product?.name || "Product"}</p>
                          <p className="text-xs text-neutral-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-neutral-900">{fmt(item.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
