import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, Plus, Search, Pencil, Trash2, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"

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

export default function HorseListings() {
  const navigate = useNavigate()
  const [horses, setHorses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/marketplace/horses")
      setHorses(data.horses || [])
    } catch (err) {
      setError(err.message || "Failed to load your horses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return horses
    const q = searchQuery.toLowerCase().trim()
    return horses.filter((h) => h.breed?.toLowerCase().includes(q) || h.location?.toLowerCase().includes(q))
  }, [horses, searchQuery])

  const handleDelete = async (horse) => {
    if (!window.confirm(`Remove "${horse.breed}" listing? This cannot be undone.`)) return
    setDeletingId(horse._id)
    try {
      await apiFetch(`/marketplace/horses/${horse._id}`, { method: "DELETE" })
      await load()
    } catch (err) {
      setError(err.message || "Failed to delete listing")
    } finally {
      setDeletingId(null)
    }
  }

  const handleViewDetails = (horse) => {
    setSelected(horse)
    setShowDetails(true)
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900">Horses</h1>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-neutral-100 text-neutral-700">
                {filtered.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by breed, location"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <Button onClick={() => navigate("/seller/horses/add")}>
                <Plus className="w-4 h-4" />
                Add Horse
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive mb-3">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-5 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Horse</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-right text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-neutral-500">Loading your horses...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Heart className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                      <p className="text-sm font-semibold text-neutral-700">No horses listed yet</p>
                      <p className="text-xs text-neutral-500 mt-1">Click "Add Horse" to create your first listing.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((horse) => (
                    <tr key={horse._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg bg-neutral-200 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                            onClick={() => handleViewDetails(horse)}
                          >
                            {horse.photos?.[0] ? (
                              <img src={getMediaUrl(horse.photos[0])} alt={horse.breed} className="w-full h-full object-cover" />
                            ) : (
                              <Heart className="w-4 h-4 text-neutral-500" />
                            )}
                          </div>
                          <span
                            className="text-sm font-medium text-neutral-900 cursor-pointer hover:text-primary"
                            onClick={() => handleViewDetails(horse)}
                          >
                            {horse.breed}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">{horse.category?.name || "—"}</td>
                      <td className="px-4 py-4 text-sm font-medium text-neutral-900">{fmt(horse.price)}</td>
                      <td className="px-4 py-4 text-sm text-neutral-600">{horse.location || "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadgeClass[horse.status]}`}>
                          {statusLabel[horse.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleViewDetails(horse)} className="p-1.5 rounded text-neutral-500 hover:bg-neutral-100" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/seller/horses/add?id=${horse._id}`)} className="p-1.5 rounded text-primary hover:bg-primary/10" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(horse)}
                            disabled={deletingId === horse._id}
                            className="p-1.5 rounded text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
            <DialogTitle className="pr-12 text-xl font-bold text-neutral-900">Horse Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 px-6 py-5">
              <div className="bg-neutral-50 rounded-xl p-4 flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-neutral-200 flex items-center justify-center overflow-hidden shrink-0">
                  {selected.photos?.[0] ? (
                    <img src={getMediaUrl(selected.photos[0])} alt={selected.breed} className="w-full h-full object-cover" />
                  ) : (
                    <Heart className="w-8 h-8 text-neutral-400" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold text-neutral-900">{selected.breed}</p>
                  <p className="text-lg font-bold text-primary">{fmt(selected.price)}</p>
                  <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadgeClass[selected.status]}`}>
                    {statusLabel[selected.status]}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-neutral-600">
                {selected.category?.name && <span>Category: {selected.category.name}</span>}
                {selected.age && <span>Age: {selected.age} yrs</span>}
                {selected.gender && <span className="capitalize">Gender: {selected.gender}</span>}
                {selected.color && <span>Color: {selected.color}</span>}
                {selected.height && <span>Height: {selected.height} hh</span>}
                {selected.location && <span>Location: {selected.location}</span>}
              </div>
              {selected.description && (
                <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">{selected.description}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
