import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Image as ImageIcon, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react"
import { apiFetch, apiUpload } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"

const defaultFormData = { title: "", subtitle: "", link: "", order: 0, image: "", status: true }

export default function AdminUserAppBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  const fetchBanners = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/banners/admin")
      setBanners(data.banners || [])
    } catch (err) {
      setError(err.message || "Failed to load banners")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [banners]
  )

  const resetModal = () => {
    setIsModalOpen(false)
    setEditingBanner(null)
    setFormData(defaultFormData)
    setSelectedImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAddNew = () => {
    setEditingBanner(null)
    setFormData({ ...defaultFormData, order: banners.length })
    setSelectedImageFile(null)
    setImagePreview(null)
    setIsModalOpen(true)
  }

  const handleEdit = (banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      link: banner.link || "",
      order: banner.order ?? 0,
      image: banner.image || "",
      status: banner.status !== "inactive",
    })
    setSelectedImageFile(null)
    setImagePreview(banner.image ? getMediaUrl(banner.image) : null)
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

  const handleDelete = async (banner) => {
    if (!window.confirm(`Delete this banner? This action cannot be undone.`)) return
    try {
      await apiFetch(`/banners/${banner._id}`, { method: "DELETE" })
      fetchBanners()
    } catch (err) {
      setError(err.message || "Failed to delete banner")
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!editingBanner && !selectedImageFile) {
      setError("Banner image is required")
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
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        link: formData.link.trim(),
        order: Number(formData.order) || 0,
        image: imageUrl || undefined,
        status: formData.status ? "active" : "inactive",
      }

      if (editingBanner) {
        await apiFetch(`/banners/${editingBanner._id}`, { method: "PUT", body: payload })
      } else {
        await apiFetch("/banners", { method: "POST", body: payload })
      }

      resetModal()
      fetchBanners()
    } catch (err) {
      setError(err.message || "Failed to save banner")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">User App Banners</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500">
              Manage the hero carousel shown at the top of the home screen in the user mobile app. Lower order
              numbers appear first.
            </p>
          </div>

          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Banner
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="w-[36%] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Banner</th>
                <th className="w-[14%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-neutral-600">Order</th>
                <th className="w-[20%] px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-600">Link</th>
                <th className="w-[12%] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-neutral-600">Status</th>
                <th className="w-[18%] px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-neutral-500">Loading banners...</p>
                  </td>
                </tr>
              ) : sortedBanners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-neutral-300" />
                    <p className="mt-2 text-lg font-semibold text-neutral-700">No banners yet</p>
                    <p className="mt-1 text-sm text-neutral-500">Add a banner to populate the app's hero carousel.</p>
                  </td>
                </tr>
              ) : (
                sortedBanners.map((banner) => (
                  <tr key={banner._id} className="align-top hover:bg-neutral-50/80">
                    <td className="px-5 py-5">
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-28 overflow-hidden rounded-xl bg-neutral-100 shrink-0">
                          {banner.image ? (
                            <img src={getMediaUrl(banner.image)} alt={banner.title || "Banner"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-neutral-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold leading-6 text-neutral-900">{banner.title || "Untitled"}</p>
                          {banner.subtitle && <p className="truncate text-xs text-neutral-500">{banner.subtitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center text-sm text-neutral-600">{banner.order ?? 0}</td>
                    <td className="px-4 py-5 text-sm text-neutral-600">
                      <p className="truncate">{banner.link || "—"}</p>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        banner.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-neutral-100 text-neutral-600 border-neutral-200"
                      }`}>
                        {banner.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(banner)} className="rounded-lg p-2 text-primary hover:bg-primary/10" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(banner)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Delete">
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
                    className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[min(720px,calc(100vh-32px))]"
                  >
                    <div className="flex items-center justify-between border-b px-6 py-4">
                      <div>
                        <h2 className="text-xl font-bold text-neutral-900">{editingBanner ? "Edit Banner" : "Add Banner"}</h2>
                        <p className="text-xs text-neutral-500">Recommended size: 1200x500px, under 5MB.</p>
                      </div>
                      <button onClick={resetModal} className="rounded-lg p-1 hover:bg-neutral-100">
                        <X className="h-5 w-5 text-neutral-500" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-neutral-700">Banner Image</label>
                          <div className="space-y-3">
                            {imagePreview && (
                              <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-neutral-300">
                                <img src={imagePreview} alt="Banner preview" className="h-full w-full object-cover" />
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={handleImageSelect}
                                className="hidden"
                                id="admin-banner-image-upload"
                              />
                              <label
                                htmlFor="admin-banner-image-upload"
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700"
                              >
                                <Upload className="h-4 w-4" />
                                {imagePreview ? "Change Image" : "Upload Image"}
                              </label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-neutral-700">Title</label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                            placeholder="Optional headline shown on the banner"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-neutral-700">Subtitle</label>
                          <input
                            type="text"
                            value={formData.subtitle}
                            onChange={(event) => setFormData((prev) => ({ ...prev, subtitle: event.target.value }))}
                            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                            placeholder="Optional supporting text"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-neutral-700">Link (optional)</label>
                          <input
                            type="text"
                            value={formData.link}
                            onChange={(event) => setFormData((prev) => ({ ...prev, link: event.target.value }))}
                            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                            placeholder="e.g. horse-marketplace, store, or a full URL"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-neutral-700">Display Order</label>
                          <input
                            type="number"
                            value={formData.order}
                            onChange={(event) => setFormData((prev) => ({ ...prev, order: event.target.value }))}
                            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                          />
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
                          {saving ? "Saving..." : editingBanner ? "Update" : "Create"}
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
