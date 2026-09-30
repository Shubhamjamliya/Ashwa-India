import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  BadgeCheck, Download, Loader2, Pencil, Plus, Search, Trash2, Upload, X, FolderTree,
} from "lucide-react"
import { apiFetch, apiUpload } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { exportToCSV } from "@/shared/lib/csvExport"
import { useAuth } from "@/shared/context/AuthContext"

const defaultFormData = { name: "", type: "", description: "", image: "", status: true }

const approvalBadgeClass = (status) => {
  const value = String(status || "pending").toLowerCase()
  if (value === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (value === "rejected") return "bg-rose-50 text-rose-700 border-rose-200"
  return "bg-amber-50 text-amber-700 border-amber-200"
}

export default function HorseCategories() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showPendingOnly, setShowPendingOnly] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  const fetchCategories = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/marketplace/categories")
      setCategories(data.categories || [])
    } catch (err) {
      setError(err.message || "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const filteredCategories = useMemo(() => {
    let result = categories
    if (showPendingOnly) result = result.filter((c) => c.approvalStatus === "pending")
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (c) => c.name?.toLowerCase().includes(query) || c.type?.toLowerCase().includes(query)
      )
    }
    return result
  }, [categories, showPendingOnly, searchQuery])

  const isMine = (category) => category?.createdBy?._id === user?.id || category?.createdBy === user?.id

  const resetModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setFormData(defaultFormData)
    setSelectedImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAddNew = () => {
    setEditingCategory(null)
    setFormData(defaultFormData)
    setSelectedImageFile(null)
    setImagePreview(null)
    setIsModalOpen(true)
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name || "",
      type: category.type || "",
      description: category.description || "",
      image: category.image || "",
      status: category.status !== "inactive",
    })
    setSelectedImageFile(null)
    setImagePreview(category.image ? getMediaUrl(category.image) : null)
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

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"? This action cannot be undone.`)) return
    try {
      await apiFetch(`/marketplace/categories/${category._id}`, { method: "DELETE" })
      fetchCategories()
    } catch (err) {
      setError(err.message || "Failed to delete category")
    }
  }

  const handleExport = () => {
    exportToCSV(
      filteredCategories,
      [
        { key: "name", label: "Category" },
        { key: "type", label: "Type" },
        { key: "status", label: "Status" },
        { key: "approvalStatus", label: "Approval" },
        { key: "createdAt", label: "Created" },
      ],
      "horse-categories"
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.name.trim()) {
      setError("Category name is required")
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
        type: formData.type.trim(),
        description: formData.description.trim(),
        image: imageUrl || undefined,
        status: formData.status ? "active" : "inactive",
      }

      if (editingCategory) {
        await apiFetch(`/marketplace/categories/${editingCategory._id}`, { method: "PUT", body: payload })
      } else {
        await apiFetch("/marketplace/categories", { method: "POST", body: payload })
      }

      resetModal()
      fetchCategories()
    } catch (err) {
      setError(err.message || "Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Horse Categories</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500">
              Propose new horse categories for your listings. New categories need admin approval before they're
              visible platform-wide.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-neutral-200 p-1">
              <button
                type="button"
                onClick={() => setShowPendingOnly(false)}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${!showPendingOnly ? "bg-neutral-900 text-white" : "text-neutral-600"}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setShowPendingOnly(true)}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${showPendingOnly ? "bg-amber-600 text-white" : "text-neutral-600"}`}
              >
                Pending
              </button>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search categories"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            <button
              onClick={handleExport}
              disabled={filteredCategories.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>

            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="w-[32%] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Category</th>
                <th className="w-[18%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Owner</th>
                <th className="w-[12%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-neutral-600">Status</th>
                <th className="w-[18%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Approval</th>
                <th className="w-[20%] px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-neutral-500">Loading categories...</p>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <FolderTree className="mx-auto h-8 w-8 text-neutral-300" />
                    <p className="mt-2 text-lg font-semibold text-neutral-700">No categories found</p>
                    <p className="mt-1 text-sm text-neutral-500">Try a different search or propose a new category.</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => {
                  const mine = isMine(category)
                  const approvalStatus = category.approvalStatus || "approved"
                  return (
                    <tr key={category._id} className="align-top hover:bg-neutral-50/80">
                      <td className="px-5 py-5">
                        <div className="flex items-start gap-3">
                          <div className="h-11 w-11 overflow-hidden rounded-2xl bg-neutral-100 shrink-0">
                            {category.image ? (
                              <img src={getMediaUrl(category.image)} alt={category.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-neutral-500">
                                {String(category.name || "C").slice(0, 1).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold leading-6 text-neutral-900">{category.name}</p>
                            <p className="text-xs text-neutral-500">{category.type || "No type"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-sm text-neutral-600">
                        {category.createdBy ? (category.createdBy.businessName || category.createdBy.name || "You") : "Admin"}
                        {category.isGlobal && (
                          <p className="text-xs text-neutral-400 mt-0.5">Global</p>
                        )}
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                          category.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-neutral-100 text-neutral-600 border-neutral-200"
                        }`}>
                          {category.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${approvalBadgeClass(approvalStatus)}`}>
                            {approvalStatus === "approved" && <BadgeCheck className="mr-1 h-3.5 w-3.5" />}
                            {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
                          </span>
                          {category.rejectionReason && (
                            <p className="max-w-[180px] text-xs leading-5 text-rose-600">{category.rejectionReason}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        {mine ? (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(category)} className="rounded-lg p-2 text-primary hover:bg-primary/10" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(category)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400 block text-right">Managed by admin</span>
                        )}
                      </td>
                    </tr>
                  )
                })
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
                    className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[min(720px,calc(100vh-32px))]"
                  >
                    <div className="flex items-center justify-between border-b px-6 py-4">
                      <div>
                        <h2 className="text-xl font-bold text-neutral-900">{editingCategory ? "Edit Category" : "Add Category"}</h2>
                        <p className="text-xs text-neutral-500">
                          {editingCategory ? "Changes are saved immediately." : "New categories need admin approval before they go live."}
                        </p>
                      </div>
                      <button onClick={resetModal} className="rounded-lg p-1 hover:bg-neutral-100">
                        <X className="h-5 w-5 text-neutral-500" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-neutral-700">Category Type</label>
                          <input
                            type="text"
                            value={formData.type}
                            onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value }))}
                            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                            placeholder="Examples: Breed, Purpose, Age Group"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-neutral-700">Category Name</label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                            placeholder="Examples: Marwari, Racing, Riding"
                          />
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
                          <label className="mb-2 block text-sm font-medium text-neutral-700">Category Image</label>
                          <div className="space-y-3">
                            {imagePreview && (
                              <div className="relative h-32 w-32 overflow-hidden rounded-2xl border border-neutral-300">
                                <img src={imagePreview} alt="Category preview" className="h-full w-full object-cover" />
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={handleImageSelect}
                                className="hidden"
                                id="horse-category-image-upload"
                              />
                              <label
                                htmlFor="horse-category-image-upload"
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700"
                              >
                                <Upload className="h-4 w-4" />
                                {imagePreview ? "Change Image" : "Upload Image"}
                              </label>
                            </div>
                          </div>
                        </div>

                        <label className="flex items-center gap-3 text-sm font-medium text-neutral-700">
                          <input
                            type="checkbox"
                            checked={formData.status}
                            onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.checked }))}
                            className="h-4 w-4 rounded border-neutral-300"
                          />
                          Active Status
                        </label>

                        {error && <p className="text-sm text-destructive">{error}</p>}
                      </div>

                      <div className="flex items-center gap-3 border-t bg-white px-6 py-4">
                        <button type="button" onClick={resetModal} className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-neutral-700">
                          Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-primary px-4 py-3 text-white hover:bg-primary/90 disabled:opacity-50">
                          {saving ? "Saving..." : editingCategory ? "Update" : "Create"}
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
