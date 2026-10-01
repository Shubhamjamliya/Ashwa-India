import { useState, useEffect, useMemo } from "react"
import {
  Search, Download, Eye, Heart, Check, X, MapPin, Calendar as CalendarIcon, User, Pencil,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { exportToCSV } from "@/shared/lib/csvExport"

const editStatusOptions = ["draft", "pending", "listed", "sold", "removed"]
const genderOptions = ["mare", "stallion", "gelding"]

const defaultEditForm = {
  breed: "", price: "", age: "", gender: "", color: "", height: "", location: "", description: "", status: "listed",
}

const INR = "₹"
const fmt = (n) => `${INR}${Number(n || 0).toLocaleString("en-IN")}`

const statusLabel = { draft: "Draft", pending: "Pending", listed: "Listed", sold: "Sold", removed: "Removed" }
const statusBadgeClass = {
  draft: "bg-neutral-200 text-neutral-700",
  pending: "bg-amber-100 text-amber-700",
  listed: "bg-emerald-100 text-emerald-700",
  sold: "bg-blue-100 text-blue-700",
  removed: "bg-red-100 text-red-700",
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

export default function HorseListings() {
  const [horses, setHorses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusTab, setStatusTab] = useState("")
  const [selected, setSelected] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [actingId, setActingId] = useState(null)
  const [editingHorse, setEditingHorse] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState(defaultEditForm)
  const [saving, setSaving] = useState(false)

  const tabs = [
    { key: "", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "listed", label: "Listed" },
    { key: "sold", label: "Sold" },
    { key: "removed", label: "Removed" },
  ]

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch(`/marketplace/horses${statusTab ? `?status=${statusTab}` : ""}`)
      setHorses(data.horses)
    } catch (err) {
      setError(err.message || "Failed to load horse listings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return horses
    const q = searchQuery.toLowerCase().trim()
    return horses.filter(
      (h) =>
        h.breed?.toLowerCase().includes(q) ||
        h.seller?.name?.toLowerCase().includes(q) ||
        h.seller?.businessName?.toLowerCase().includes(q) ||
        h.location?.toLowerCase().includes(q)
    )
  }, [horses, searchQuery])

  const updateStatus = async (id, status) => {
    setActingId(id)
    try {
      await apiFetch(`/marketplace/horses/${id}`, { method: "PUT", body: { status } })
      await load()
      setShowDetails(false)
    } catch (err) {
      setError(err.message || "Failed to update listing")
    } finally {
      setActingId(null)
    }
  }

  const handleViewDetails = (horse) => {
    setSelected(horse)
    setShowDetails(true)
  }

  const handleEdit = (horse) => {
    setEditingHorse(horse)
    setEditForm({
      breed: horse.breed || "",
      price: String(horse.price ?? ""),
      age: String(horse.age ?? ""),
      gender: horse.gender || "",
      color: horse.color || "",
      height: String(horse.height ?? ""),
      location: horse.location || "",
      description: horse.description || "",
      status: horse.status || "listed",
    })
    setShowEdit(true)
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()
    if (!editForm.breed.trim()) {
      setError("Breed is required")
      return
    }
    if (!editForm.price || Number(editForm.price) <= 0) {
      setError("Enter a valid price")
      return
    }
    setError("")
    setSaving(true)
    try {
      await apiFetch(`/marketplace/horses/${editingHorse._id}`, {
        method: "PUT",
        body: {
          breed: editForm.breed.trim(),
          price: Number(editForm.price),
          age: editForm.age ? Number(editForm.age) : undefined,
          gender: editForm.gender || undefined,
          color: editForm.color.trim() || undefined,
          height: editForm.height ? Number(editForm.height) : undefined,
          location: editForm.location.trim() || undefined,
          description: editForm.description.trim() || undefined,
          status: editForm.status,
        },
      })
      setShowEdit(false)
      setEditingHorse(null)
      await load()
    } catch (err) {
      setError(err.message || "Failed to update listing")
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    exportToCSV(
      filtered.map((h) => ({ ...h, sellerName: h.seller?.name || h.seller?.businessName || "" })),
      [
        { key: "breed", label: "Breed" },
        { key: "sellerName", label: "Seller" },
        { key: "price", label: "Price" },
        { key: "location", label: "Location" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Listed On" },
      ],
      "horse-listings"
    )
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-neutral-900">Horse listings</h2>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-neutral-100 text-neutral-700">
                {filtered.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by breed, seller, location"
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
            <table className="w-full min-w-[980px]">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Sl</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Horse</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-neutral-500">Loading listings...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-neutral-500">No horse listings found</td></tr>
                ) : (
                  filtered.map((horse, index) => (
                    <tr key={horse._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-neutral-700">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer border border-neutral-100"
                            onClick={() => handleViewDetails(horse)}
                          >
                            {horse.photos?.[0] ? (
                              <img src={getMediaUrl(horse.photos[0])} alt={horse.breed} className="w-full h-full object-cover" />
                            ) : (
                              <Heart className="w-4 h-4" />
                            )}
                          </div>
                          <span
                            className="text-sm font-medium text-neutral-900 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleViewDetails(horse)}
                          >
                            {horse.breed}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-700">{horse.seller?.businessName || horse.seller?.name || "—"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-neutral-900">{fmt(horse.price)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-700">{horse.location || "—"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadgeClass[horse.status]}`}>
                          {statusLabel[horse.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          {horse.status === "pending" && (
                            <>
                              <Button size="sm" disabled={actingId === horse._id} onClick={() => updateStatus(horse._id, "listed")}>
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" disabled={actingId === horse._id} onClick={() => updateStatus(horse._id, "removed")}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          <button
                            onClick={() => handleViewDetails(horse)}
                            className="p-1.5 rounded text-primary hover:bg-primary/10 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(horse)}
                            className="p-1.5 rounded text-primary hover:bg-primary/10 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
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
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg mx-auto p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-200">
            <DialogTitle className="pr-12 text-xl font-bold text-neutral-900">Horse Listing Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 px-6 py-5">
              <div className="bg-neutral-50 rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {selected.photos?.[0] ? (
                      <img src={getMediaUrl(selected.photos[0])} alt={selected.breed} className="w-full h-full object-cover" />
                    ) : (
                      <Heart className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-neutral-900">{selected.breed}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusBadgeClass[selected.status]}`}>
                        {statusLabel[selected.status]}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-primary mb-2">{fmt(selected.price)}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm text-neutral-600">
                      {selected.age && <span>Age: {selected.age} yrs</span>}
                      {selected.gender && <span className="capitalize">Gender: {selected.gender}</span>}
                      {selected.color && <span>Color: {selected.color}</span>}
                      {selected.height && <span>Height: {selected.height} hh</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <User className="w-4 h-4" />
                  <span>Seller: {selected.seller?.businessName || selected.seller?.name || "—"} ({selected.seller?.phone})</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <MapPin className="w-4 h-4" />
                  <span>{selected.location || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Listed: {formatDateTime(selected.createdAt)}</span>
                </div>
              </div>

              {selected.description && (
                <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">{selected.description}</p>
              )}

              <div className="flex gap-2">
                {selected.status === "pending" && (
                  <>
                    <Button className="flex-1" disabled={actingId === selected._id} onClick={() => updateStatus(selected._id, "listed")}>
                      <Check className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button variant="outline" className="flex-1" disabled={actingId === selected._id} onClick={() => updateStatus(selected._id, "removed")}>
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDetails(false)
                    handleEdit(selected)
                  }}
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg mx-auto p-0 gap-0 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-200">
            <DialogTitle className="pr-12 text-xl font-bold text-neutral-900">Edit Horse Listing</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Breed</label>
              <input
                type="text"
                required
                value={editForm.breed}
                onChange={(e) => setEditForm((p) => ({ ...p, breed: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editForm.price}
                  onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Age (years)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.age}
                  onChange={(e) => setEditForm((p) => ({ ...p, age: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                >
                  <option value="">—</option>
                  {genderOptions.map((g) => (
                    <option key={g} value={g} className="capitalize">{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Color</label>
                <input
                  type="text"
                  value={editForm.color}
                  onChange={(e) => setEditForm((p) => ({ ...p, color: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Height (hh)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={editForm.height}
                  onChange={(e) => setEditForm((p) => ({ ...p, height: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Description</label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
              >
                {editStatusOptions.map((s) => (
                  <option key={s} value={s} className="capitalize">{statusLabel[s]}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEdit(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
