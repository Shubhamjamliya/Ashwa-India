import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Edit, MapPin, Plus, Search, Trash2 } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

export default function ZoneSetup() {
  const navigate = useNavigate()
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchZones()
  }, [])

  const fetchZones = async () => {
    try {
      setLoading(true)
      const data = await apiFetch("/zones")
      setZones(data.zones || [])
    } catch (err) {
      setZones([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm("Are you sure you want to delete this zone?")) return
    try {
      await apiFetch(`/zones/${zoneId}`, { method: "DELETE" })
      fetchZones()
    } catch (err) {
      alert(err.message || "Failed to delete zone")
    }
  }

  const filteredZones = zones.filter(
    (zone) =>
      zone.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.serviceLocation?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 p-2 lg:p-3">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 flex items-center gap-3 md:mb-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Zone Setup</h1>
              <p className="text-sm text-neutral-600">Manage the areas where Ashwa India is available</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/system/zones/add")}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
            <span>Add Zone</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-neutral-400" />
            <input
              type="text"
              placeholder="Search zones by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Zones List */}
        {loading ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-neutral-600">Loading zones...</p>
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center shadow-sm">
            <MapPin className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">No zones found</h3>
            <p className="mb-6 text-neutral-600">
              {searchQuery ? "Try adjusting your search query" : "Create your first zone to get started"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate("/admin/system/zones/add")}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                <span>Add Zone</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredZones.map((zone) => (
              <div
                key={zone._id}
                className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: zone.color || "#C28D2E" }} />
                      <h3 className="text-lg font-semibold text-neutral-900">{zone.name || "Unnamed Zone"}</h3>
                    </div>
                    <p className="text-sm text-neutral-600">{zone.serviceLocation || zone.country || "N/A"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/admin/system/zones/edit/${zone._id}`)}
                      className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-primary/10 hover:text-primary"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone._id)}
                      className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Unit:</span>
                    <span className="font-medium text-neutral-900">{zone.unit === "miles" ? "miles" : "km"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Status:</span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        zone.isActive ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-800"
                      }`}
                    >
                      {zone.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {zone.polygon?.coordinates?.[0] && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Points:</span>
                      <span className="font-medium text-neutral-900">{zone.polygon.coordinates[0].length - 1}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
