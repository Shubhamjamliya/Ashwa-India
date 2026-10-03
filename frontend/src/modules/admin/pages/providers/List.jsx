import { useState, useEffect, useMemo } from "react"
import {
  Search, Download, Eye, Mail, Phone, MapPin, Calendar as CalendarIcon, UserCog, Check, X, Briefcase,
} from "lucide-react"
import ProviderDetailDialog from "./ProviderDetailDialog"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"
import { exportToCSV } from "@/shared/lib/csvExport"

const statusLabel = { pending: "Pending", approved: "Approved", rejected: "Rejected", suspended: "Suspended", archived: "Archived" }
const statusBadgeClass = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-neutral-200 text-neutral-700",
  archived: "bg-neutral-200 text-neutral-700",
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

function getInitials(name) {
  if (!name) return "NA"
  return (
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "NA"
  )
}

export default function ProvidersList() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusTab, setStatusTab] = useState("")
  const [selected, setSelected] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reviews, setReviews] = useState([])
  const [actingId, setActingId] = useState(null)

  const tabs = [
    { key: "", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ]

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch(`/providers${statusTab ? `?status=${statusTab}` : ""}`)
      setProviders(data.providers)
    } catch (err) {
      setError(err.message || "Failed to load providers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab])

  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return providers
    const q = searchQuery.toLowerCase().trim()
    return providers.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.businessName?.toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        p.phone?.includes(q)
    )
  }, [providers, searchQuery])

  const updateStatus = async (id, status) => {
    setActingId(id)
    try {
      await apiFetch(`/providers/${id}/status`, { method: "PATCH", body: { status } })
      await load()
      setShowDetails(false)
    } catch (err) {
      setError(err.message || "Failed to update provider")
    } finally {
      setActingId(null)
    }
  }

  const handleViewDetails = async (provider) => {
    setSelected(provider)
    setReviews([])
    setDetailLoading(true)
    setShowDetails(true)
    try {
      const data = await apiFetch(`/providers/${provider._id}`)
      setSelected(data.provider)
      setReviews(data.reviews || [])
    } catch (err) {
      setError(err.message || "Failed to load provider details")
      setShowDetails(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleExport = () => {
    exportToCSV(
      filteredProviders,
      [
        { key: "name", label: "Name" },
        { key: "businessName", label: "Business Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "location", label: "Location" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Joined" },
      ],
      "providers"
    )
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-neutral-900">Service Provider list</h2>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-neutral-100 text-neutral-700">
                {filteredProviders.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by name, business, phone"
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
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Contact Information</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Services</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-neutral-500">Loading providers...</td></tr>
                ) : filteredProviders.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-neutral-500">No providers found</td></tr>
                ) : (
                  filteredProviders.map((provider, index) => (
                    <tr key={provider._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-neutral-700">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer border border-neutral-100"
                            onClick={() => handleViewDetails(provider)}
                          >
                            <span className="text-xs font-semibold">{getInitials(provider.name)}</span>
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-medium text-neutral-900 cursor-pointer hover:text-primary transition-colors truncate"
                              onClick={() => handleViewDetails(provider)}
                            >
                              {provider.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">{provider.businessName || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-neutral-700">{provider.email || "NA"}</span>
                          <span className="text-xs text-neutral-500">{provider.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-700">
                          {provider.serviceTypes?.length ? provider.serviceTypes.join(", ") : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-700">{provider.location || "—"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadgeClass[provider.status]}`}>
                          {statusLabel[provider.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewDetails(provider)}
                          className="p-1.5 rounded text-primary hover:bg-primary/10 transition-colors"
                          aria-label="View full details"
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

      <ProviderDetailDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        provider={selected}
        reviews={reviews}
        loading={detailLoading}
        acting={Boolean(selected) && actingId === selected._id}
        onApprove={(id) => updateStatus(id, "approved")}
        onReject={(id) => updateStatus(id, "rejected")}
      />
    </div>
  )
}
