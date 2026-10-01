import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Package, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react"
import { apiFetch, apiUpload } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"

const INR = "₹"
const fmt = (n) => `${INR}${Number(n || 0).toLocaleString("en-IN")}`

const defaultFormData = { name: "", category: "", price: "", stock: "", description: "", image: "", status: "draft" }

const tabs = [
  { key: "", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
]

const statusLabel = { draft: "Draft", active: "Active", inactive: "Inactive" }
const statusBadgeClass = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-neutral-100 text-neutral-600 border-neutral-200",
}

export default function SellerStoreProducts() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusTab, setStatusTab] = useState("")
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      const [productsRes, catRes] = await Promise.all([
        apiFetch("/store/products"),
        apiFetch("/store/categories"),
      ])
      setProducts(productsRes.products || [])
      setCategories((catRes.categories || []).filter((c) => c.status === "active"))
    } catch (err) {
      setError(err.message || "Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredProducts = useMemo(() => {
    let list = products
    if (statusTab) list = list.filter((p) => p.status === statusTab)
    const query = searchQuery.trim().toLowerCase()
    if (query) list = list.filter((p) => p.name?.toLowerCase().includes(query))
    return list
  }, [products, searchQuery, statusTab])

  const resetModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setFormData(defaultFormData)
    setSelectedImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    setFormData({ ...defaultFormData, category: categories[0]?._id || "" })
    setSelectedImageFile(null)
    setImagePreview(null)
    setIsModalOpen(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || "",
      category: product.category?._id || product.category || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      description: product.description || "",
      image: product.photos?.[0] || "",
      status: product.status || "draft",
    })
    setSelectedImageFile(null)
    setImagePreview(product.photos?.[0] ? getMediaUrl(product.photos[0]) : null)
    setIsModalOpen(true)
  }

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload PNG, JPG, JPEG, or WEBP.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.")
      return
    }
    setError("")
    setSelectedImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This action cannot be undone.`)) return
    try {
      await apiFetch(`/store/products/${product._id}`, { method: "DELETE" })
      fetchData()
    } catch (err) {
      setError(err.message || "Failed to delete product")
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.name.trim()) {
      setError("Product name is required")
      return
    }
    if (!formData.category) {
      setError("Select a category")
      return
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError("Enter a valid price")
      return
    }
    setError("")
    setSaving(true)
    try {
      let imageUrl = formData.image
      if (selectedImageFile) {
        const uploadForm = new FormData()
        uploadForm.append("file", selectedImageFile)
        const uploadRes = await apiUpload("/uploads/image", { method: "POST", formData: uploadForm })
        imageUrl = uploadRes.url || imageUrl
      }

      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock) || 0,
        description: formData.description.trim(),
        photos: imageUrl ? [imageUrl] : [],
        status: formData.status,
      }

      if (editingProduct) {
        await apiFetch(`/store/products/${editingProduct._id}`, { method: "PUT", body: payload })
      } else {
        await apiFetch("/store/products", { method: "POST", body: payload })
      }

      resetModal()
      fetchData()
    } catch (err) {
      setError(err.message || "Failed to save product")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Products</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500">
              New products are listed as Draft until an admin approves them. You can edit or remove your products
              anytime.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-neutral-200 p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setStatusTab(t.key)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${
                    statusTab === t.key ? "bg-neutral-900 text-white" : "text-neutral-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search products"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-neutral-900"
              />
            </div>
            <button
              onClick={handleAddNew}
              disabled={categories.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>
        {categories.length === 0 && !loading && (
          <p className="mt-3 text-sm text-amber-600">
            No product categories available yet — check the Product Categories page or ask the admin to add one.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="w-[30%] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Product</th>
                <th className="w-[20%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Category</th>
                <th className="w-[14%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Price</th>
                <th className="w-[12%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Stock</th>
                <th className="w-[12%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-neutral-600">Status</th>
                <th className="w-[12%] px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-neutral-500">Loading products...</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Package className="mx-auto h-8 w-8 text-neutral-300" />
                    <p className="mt-2 text-lg font-semibold text-neutral-700">No products found</p>
                    <p className="mt-1 text-sm text-neutral-500">Add your first product to get started.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="align-top hover:bg-neutral-50/80">
                    <td className="px-5 py-5">
                      <div className="flex items-start gap-3">
                        <div className="h-11 w-11 overflow-hidden rounded-2xl bg-neutral-100 shrink-0">
                          {product.photos?.[0] ? (
                            <img src={getMediaUrl(product.photos[0])} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-4 w-4 text-neutral-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-base font-semibold leading-6 text-neutral-900">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-sm text-neutral-600">{product.category?.name || "—"}</td>
                    <td className="px-4 py-5 text-sm font-medium text-neutral-900">{fmt(product.price)}</td>
                    <td className="px-4 py-5 text-sm text-neutral-600">{product.stock ?? 0}</td>
                    <td className="px-4 py-5 text-center">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass[product.status]}`}>
                        {statusLabel[product.status]}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(product)} className="rounded-lg p-2 text-primary hover:bg-primary/10" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(product)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
            {isModalOpen && (
              <div className="fixed inset-0 z-[200]">
                <div className="absolute inset-0 bg-black/50" onClick={resetModal} />
                <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[min(760px,calc(100vh-32px))]"
                  >
                    <div className="flex items-center justify-between border-b px-6 py-4">
                      <h2 className="text-xl font-bold text-neutral-900">{editingProduct ? "Edit Product" : "Add Product"}</h2>
                      <button onClick={resetModal} className="rounded-lg p-1 hover:bg-neutral-100">
                        <X className="h-5 w-5 text-neutral-500" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-neutral-700">Product Name</label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                            placeholder="Examples: Premium Horse Shampoo 1L"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-neutral-700">Category</label>
                          <select
                            value={formData.category}
                            onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                          >
                            {categories.map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-neutral-700">Price (₹)</label>
                            <input
                              type="number"
                              min="0"
                              required
                              value={formData.price}
                              onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))}
                              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-neutral-700">Stock</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.stock}
                              onChange={(event) => setFormData((prev) => ({ ...prev, stock: event.target.value }))}
                              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-neutral-700">Description</label>
                          <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900 resize-none"
                            placeholder="Optional description"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-neutral-700">Product Image</label>
                          <div className="space-y-3">
                            {imagePreview && (
                              <div className="relative h-32 w-32 overflow-hidden rounded-2xl border border-neutral-300">
                                <img src={imagePreview} alt="Product preview" className="h-full w-full object-cover" />
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={handleImageSelect}
                                className="hidden"
                                id="seller-product-image-upload"
                              />
                              <label
                                htmlFor="seller-product-image-upload"
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700"
                              >
                                <Upload className="h-4 w-4" />
                                {imagePreview ? "Change Image" : "Upload Image"}
                              </label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-neutral-700">Status</label>
                          <select
                            value={formData.status}
                            onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
                            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                          >
                            <option value="draft">Draft (pending admin approval)</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}
                      </div>

                      <div className="flex items-center gap-3 border-t bg-white px-6 py-4">
                        <button type="button" onClick={resetModal} className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-neutral-700">
                          Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-primary px-4 py-3 text-white hover:bg-primary/90 disabled:opacity-50">
                          {saving ? "Saving..." : editingProduct ? "Update" : "Create"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
