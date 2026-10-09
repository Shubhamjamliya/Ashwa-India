import { useState, useEffect, useMemo } from "react"
import {
  Search, Download, Eye, Mail, Phone, MapPin, Calendar as CalendarIcon, Check, X, Building2, Star, Users, Wallet,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { apiFetch } from "@/shared/lib/api"
import { exportToCSV } from "@/shared/lib/csvExport"
import OpsPanel from "./OpsPanel"

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

export default function TransportersList() {
  const [transporters, setTransporters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusTab, setStatusTab] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const selected = useMemo(() => transporters.find((t) => t._id === selectedId) || null, [transporters, selectedId])
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
      const data = await apiFetch(`/transporters${statusTab ? `?status=${statusTab}` : ""}`)
      setTransporters(data.transporters)
    } catch (err) {
      setError(err.message || "Failed to load transporters")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return transporters
    const q = searchQuery.toLowerCase().trim()
    return transporters.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.businessName?.toLowerCase().includes(q) ||
        (t.email || "").toLowerCase().includes(q) ||
        t.phone?.includes(q)
    )
  }, [transporters, searchQuery])

  const updateStatus = async (id, status) => {
    setActingId(id)
    try {
      await apiFetch(`/transporters/${id}/status`, { method: "PATCH", body: { status } })
      await load()
      setShowDetails(false)
    } catch (err) {
      setError(err.message || "Failed to update transporter")
    } finally {
      setActingId(null)
    }
  }

  const handleViewDetails = (transporter) => {
    setSelectedId(transporter._id)
    setShowDetails(true)
  }

  const handleExport = () => {
    exportToCSV(
      filtered,
      [
        { key: "name", label: "Name" },
        { key: "businessName", label: "Business Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "serviceArea", label: "Service Area" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Joined" },
      ],
      "transporters"
    )
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-neutral-900">Transporter list</h2>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-neutral-100 text-neutral-700">
                {filtered.length}
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
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Transporter</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Contact Information</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Vehicle Types</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Service Area</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-neutral-500">Loading transporters...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-neutral-500">No transporters found</td></tr>
                ) : (
                  filtered.map((t, index) => (
                    <tr key={t._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-neutral-700">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer border border-neutral-100"
                            onClick={() => handleViewDetails(t)}
                          >
                            <span className="text-xs font-semibold">{getInitials(t.name)}</span>
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-medium text-neutral-900 cursor-pointer hover:text-primary transition-colors truncate"
                              onClick={() => handleViewDetails(t)}
                            >
                              {t.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">{t.businessName || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-neutral-700">{t.email || "NA"}</span>
                          <span className="text-xs text-neutral-500">{t.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-700">
                          {t.vehicleTypes?.length ? t.vehicleTypes.join(", ") : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-700">{t.serviceArea || "—"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusBadgeClass[t.status]}`}>
                          {statusLabel[t.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(t)}
                            aria-label={`View ${t.name || "transporter"}`}
                            title="View details"
                            className="p-1.5 rounded text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {t.status === "pending" && (
                            <>
                              <Button size="sm" disabled={actingId === t._id} onClick={() => updateStatus(t._id, "approved")}>
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" disabled={actingId === t._id} onClick={() => updateStatus(t._id, "rejected")}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
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

      <Dialog open={showDetails && Boolean(selected)} onOpenChange={setShowDetails}>
        <DialogContent className="flex max-h-[90vh] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
          {selected && (
            <>
              {/* Header */}
              <DialogHeader className="shrink-0 bg-[#0B1C33] px-6 pb-5 pt-6 text-white">
                <DialogTitle className="sr-only">Transporter details</DialogTitle>
                <div className="flex items-center gap-4 pr-8">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#C28D2E] bg-white/10 text-lg font-extrabold text-[#C28D2E]">
                    {getInitials(selected.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-bold">{selected.name || "Unnamed"}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusBadgeClass[selected.status]}`}>
                        {statusLabel[selected.status]}
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-white/70">
                      <Building2 className="h-3.5 w-3.5 shrink-0" /> {selected.businessName || "No business name"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-xl bg-white/10 py-2.5 text-center">
                  <div>
                    <p className="flex items-center justify-center gap-1 text-base font-extrabold">
                      <Star className="h-4 w-4 fill-[#C28D2E] text-[#C28D2E]" /> {selected.rating?.count ? selected.rating.average.toFixed(1) : "—"}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/55">
                      {selected.rating?.count ? `${selected.rating.count} review${selected.rating.count === 1 ? "" : "s"}` : "No reviews"}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center justify-center gap-1.5 text-base font-extrabold">
                      <span className={`h-2 w-2 rounded-full ${selected.isOnline === false ? "bg-red-400" : "bg-emerald-400"}`} />
                      {selected.isOnline === false ? "Offline" : "Online"}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/55">Availability</p>
                  </div>
                  <div>
                    <p className="text-base font-extrabold capitalize">{selected.companyType || "—"}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/55">Account type</p>
                  </div>
                </div>
              </DialogHeader>

              {/* Scrolling body */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-neutral-50 px-6 py-5">
                <section className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="mb-3 text-sm font-bold text-neutral-900">Contact and service</p>
                  <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                    {[
                      [Phone, "Phone", selected.phone, `tel:${selected.phone}`],
                      [Mail, "Email", selected.email || "Not provided", selected.email ? `mailto:${selected.email}` : null],
                      [MapPin, "Service area", selected.serviceArea || "Not set"],
                      [Users, "Offers", selected.serviceType === "both" ? "Private and shared" : selected.serviceType || "private"],
                      [CalendarIcon, "Joined", formatDateTime(selected.createdAt)],
                      [Wallet, "Own rate", selected.pricePerKm ? `₹${selected.pricePerKm}/km (older bookings only)` : "Admin fares apply"],
                    ].map(([Icon, label, value, href]) => (
                      <div key={label} className="flex min-w-0 items-start gap-2.5">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                          <Icon className="h-3.5 w-3.5 text-neutral-500" />
                        </span>
                        <div className="min-w-0">
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</dt>
                          <dd className="break-words font-medium text-neutral-900">
                            {href ? (
                              <a href={href} className="hover:underline">
                                {value}
                              </a>
                            ) : (
                              value
                            )}
                          </dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                  {selected.vehicleTypes?.length > 0 && (
                    <div className="mt-4 border-t border-neutral-100 pt-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Vehicle types listed on profile</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.vehicleTypes.map((v) => (
                          <span key={v} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <OpsPanel transporter={selected} onChanged={load} />
              </div>

              {/* Pending transporters can be decided without leaving the modal */}
              {selected.status === "pending" && (
                <div className="flex shrink-0 gap-2 border-t border-neutral-200 bg-white px-6 py-4">
                  <Button variant="outline" className="flex-1" disabled={actingId === selected._id} onClick={() => updateStatus(selected._id, "rejected")}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                  <Button className="flex-1" disabled={actingId === selected._id} onClick={() => updateStatus(selected._id, "approved")}>
                    <Check className="h-4 w-4" /> Approve transporter
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
