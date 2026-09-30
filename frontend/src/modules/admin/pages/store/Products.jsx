import { useState, useEffect, useMemo } from "react"
import {
  Search, Download, Eye, Package, Check, X, Calendar as CalendarIcon, User,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { exportToCSV } from "@/shared/lib/csvExport"

const INR = "₹"
const fmt = (n) => `${INR}${Number(n || 0).toLocaleString("en-IN")}`

const statusLabel = { draft: "Draft", active: "Active", inactive: "Inactive" }
const statusBadgeClass = {
  draft: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-neutral-200 text-neutral-700",
}

function formatDateTime(value) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const day = String(d.getDate()).padStart(2, "0")
  const month = d.toLocaleString("en-GB", { month: "short" })
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

export default function StoreProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusTab, setStatusTab] = useState("")
  const [selected, setSelected] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [actingId, setActingId] = useState(null)

  const tabs = [
    { key: "", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
  ]

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch(`/store/products${statusTab ? `?status=${statusTab}` : ""}`)
      setProducts(data.products)
    } catch (err) {
      setError(err.message || "Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return products
    const q = searchQuery.toLowerCase().trim()
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.seller?.name?.toLowerCase().includes(q) ||
        p.seller?.businessName?.toLowerCase().includes(q)
    )
  }, [products, searchQuery])

  const updateStatus = async (id, status) => {
    setActingId(id)
    try {
      await apiFetch(`/store/products/${id}`, { method: "PUT", body: { status } })
      await load()
      setShowDetails(false)
    } catch (err) {
      setError(err.message || "Failed to update product")
    } finally {
      setActingId(null)
    }
  }

  const handleViewDetails = (product) => {
    setSelected(product)
    setShowDetails(true)
  }

  const handleExport = () => {
    exportToCSV(
      filtered.map((p) => ({ ...p, sellerName: p.seller?.name || p.seller?.businessName || "" })),
      [
        { key: "name", label: "Product" },
        { key: "sellerName", label: "Seller" },
        { key: "price", label: "Price" },
        { key: "stock", label: "Stock" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Listed On" },
      ],
      "store-products"
    )
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-neutral-900">Store products</h2>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-neutral-100 text-neutral-700">
                {filtered.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by product, seller"
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

          <div className="inline-flex p-1 bg-neutral-100 rounded-xl mb-4">
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
            <table className="w-full min-w-[900px]">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Sl</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-neutral-500">Loading products...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-neutral-500">No products found</td></tr>
                ) : (
                  filtered.map((product, index) => (
                    <tr key={product._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-neutral-700">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer border border-neutral-100"
                            onClick={() => handleViewDetails(product)}
                          >
                            {product.photos?.[0] ? (
                              <img src={getMediaUrl(product.photos[0])} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4" />
                            )}
                          </div>
                          <span
                            className="text-sm font-medium text-neutral-900 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleViewDetails(product)}
                          >
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-700">{product.seller?.businessName || product.seller?.name || "—"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-neutral-900">{fmt(product.price)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-700">{product.stock ?? 0}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadgeClass[product.status]}`}>
                          {statusLabel[product.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {product.status === "draft" ? (
                          <div className="flex justify-center gap-2">
                            <Button size="sm" disabled={actingId === product._id} onClick={() => updateStatus(product._id, "active")}>
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" disabled={actingId === product._id} onClick={() => updateStatus(product._id, "inactive")}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleViewDetails(product)}
                            className="p-1.5 rounded text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
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
            <DialogTitle className="pr-12 text-xl font-bold text-neutral-900">Product Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 px-6 py-5">
              <div className="bg-neutral-50 rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {selected.photos?.[0] ? (
                      <img src={getMediaUrl(selected.photos[0])} alt={selected.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-neutral-900">{selected.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusBadgeClass[selected.status]}`}>
                        {statusLabel[selected.status]}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-primary mb-2">{fmt(selected.price)}</p>
                    <p className="text-sm text-neutral-600">Stock: {selected.stock ?? 0} units</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <User className="w-4 h-4" />
                  <span>Seller: {selected.seller?.businessName || selected.seller?.name || "—"} ({selected.seller?.phone})</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Listed: {formatDateTime(selected.createdAt)}</span>
                </div>
              </div>

              {selected.description && (
                <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">{selected.description}</p>
              )}

              {selected.status === "draft" && (
                <div className="flex gap-2">
                  <Button className="flex-1" disabled={actingId === selected._id} onClick={() => updateStatus(selected._id, "active")}>
                    <Check className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button variant="outline" className="flex-1" disabled={actingId === selected._id} onClick={() => updateStatus(selected._id, "inactive")}>
                    <X className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
