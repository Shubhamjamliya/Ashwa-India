import { useState, useEffect, useMemo } from "react"
import { Search, Download, Eye, Mail, Phone, Calendar as CalendarIcon, User as UserIcon, CheckCircle, XCircle } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { apiFetch } from "@/shared/lib/api"
import { exportToCSV } from "@/shared/lib/csvExport"

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

export default function UsersList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({ status: "", sortBy: "" })
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/users")
      setUsers(data.users)
    } catch (err) {
      setError(err.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredUsers = useMemo(() => {
    let result = [...users]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (u) => u.name?.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || u.phone?.includes(q)
      )
    }

    if (filters.status) {
      result = result.filter((u) => u.status === filters.status)
    }

    if (filters.sortBy === "name-asc") result.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    if (filters.sortBy === "name-desc") result.sort((a, b) => (b.name || "").localeCompare(a.name || ""))

    return result
  }, [users, searchQuery, filters])

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === "active" ? "suspended" : "active"
    setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, status: nextStatus } : u)))
    try {
      await apiFetch(`/users/${user._id}/status`, { method: "PATCH", body: { status: nextStatus } })
    } catch (err) {
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, status: user.status } : u)))
      setError(err.message || "Failed to update status")
    }
  }

  const handleViewDetails = (user) => {
    setSelectedUser(user)
    setShowDetails(true)
  }

  const handleExport = () => {
    exportToCSV(
      filteredUsers,
      [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Joined" },
      ],
      "users"
    )
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm"
              >
                <option value="">Default</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: "", sortBy: "" })}
                className="px-6 py-2.5 text-sm font-medium rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 transition-all"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-neutral-900">User list</h2>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-neutral-100 text-neutral-700">
                {filteredUsers.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by name, phone, email"
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

          {error && <p className="text-sm text-destructive mb-3">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Sl</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Contact Information</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-neutral-500">Loading users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-neutral-500">No users found</td></tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-neutral-700">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer border border-neutral-100"
                            onClick={() => handleViewDetails(user)}
                          >
                            <span className="text-xs font-semibold">{getInitials(user.name)}</span>
                          </div>
                          <span
                            className="text-sm font-medium text-neutral-900 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleViewDetails(user)}
                          >
                            {user.name || "Unnamed"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-neutral-700">{user.email || "NA"}</span>
                          <span className="text-xs text-neutral-500">{user.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-700">{formatDateTime(user.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            user.status === "active" ? "bg-emerald-600" : "bg-neutral-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.status === "active" ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewDetails(user)}
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
            <DialogTitle className="pr-12 text-xl font-bold text-neutral-900">User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 px-6 py-5">
              <div className="bg-neutral-50 rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-8 h-8 text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-neutral-900">{selectedUser.name || "Unnamed"}</h3>
                      {selectedUser.status === "active" ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1 capitalize">
                          <XCircle className="w-3 h-3" /> {selectedUser.status}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 mt-3">
                      <div className="flex items-center gap-2 text-sm text-neutral-600 min-w-0">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{selectedUser.email || "NA"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600 min-w-0">
                        <Phone className="w-4 h-4" />
                        <span>{selectedUser.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Joined: {formatDateTime(selectedUser.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
