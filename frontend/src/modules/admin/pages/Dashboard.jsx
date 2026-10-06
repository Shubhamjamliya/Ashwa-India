import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/ui/select"
import { Card, CardContent } from "@/shared/components/ui/card"
import {
  Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import {
  ArrowUpRight, Users, Heart, Calendar, Truck, DollarSign, Store, UserCheck, MessageSquare,
  Percent, Wallet, Navigation, PackageX,
} from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const num = (n) => Number(n || 0).toLocaleString("en-IN")

const STATUS_COLOR = {
  Completed: "#16a34a",
  Ongoing: "#0ea5e9",
  Pending: "#f59e0b",
  Cancelled: "#ef4444",
}

function MetricCard({ title, value, helper, icon, accent, path, loading }) {
  const navigate = useNavigate()
  return (
    <Card
      className="group relative overflow-hidden p-0 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]"
      onClick={() => path && navigate(path)}
    >
      <CardContent className="relative flex flex-col gap-2 px-4 pb-4 pt-4">
        <div className={`absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-60 ${accent}`} />
        <div className="relative z-10 flex items-center justify-between">
          <div className="mr-2 min-w-0 flex-1">
            <p className="mb-1 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">{title}</p>
            <p className="mb-1 text-xl font-bold leading-tight text-neutral-900">{loading ? "—" : value}</p>
            <p className="line-clamp-1 text-[10px] font-medium text-neutral-500">{helper}</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 shadow-sm ring-1 ring-neutral-200 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110">
            {icon}
          </div>
        </div>
        <div className="absolute bottom-2 right-2 translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <ArrowUpRight className="h-3 w-3 text-neutral-400" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminHome() {
  const [period, setPeriod] = useState("overall")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    apiFetch(`/admin/dashboard?period=${period}`)
      .then(setData)
      .catch((err) => setError(err.message || "Could not load dashboard"))
      .finally(() => setLoading(false))
  }, [period])

  const t = data?.totals || {}
  const periodLabel = { overall: "all time", today: "today", week: "this week", month: "this month" }[period]

  return (
    <div className="px-4 pb-10 pt-4 lg:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_30px_120px_-60px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 border-b border-neutral-200 bg-gradient-to-br from-white via-neutral-50 to-neutral-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Admin Overview</p>
            <h1 className="text-2xl font-semibold text-neutral-900">Ashwa India Command Center</h1>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="Overall" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-6 px-6 py-6">
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              loading={loading}
              title="Total users"
              value={num(t.totalUsers)}
              helper={`${num(t.newUsers)} joined ${periodLabel}`}
              icon={<Users className="h-5 w-5 text-emerald-600" />}
              accent="bg-emerald-200/40"
              path="/admin/users"
            />
            <MetricCard
              loading={loading}
              title="Horse listings"
              value={num(t.horseListings)}
              helper="Listed for sale"
              icon={<Heart className="h-5 w-5 text-rose-600" />}
              accent="bg-rose-200/40"
              path="/admin/horses/listings"
            />
            <MetricCard
              loading={loading}
              title="Active bookings"
              value={num(t.activeBookings)}
              helper="Store orders, transport and services in progress"
              icon={<Calendar className="h-5 w-5 text-amber-600" />}
              accent="bg-amber-200/40"
              path="/admin/bookings"
            />
            <MetricCard
              loading={loading}
              title="Transport requests"
              value={num(t.transportRequests)}
              helper={`Requested ${periodLabel}`}
              icon={<Truck className="h-5 w-5 text-blue-600" />}
              accent="bg-blue-200/40"
              path="/admin/transport/requests"
            />
            <MetricCard
              loading={loading}
              title="Gross revenue"
              value={fmt(t.grossRevenue)}
              helper={`Settled sales ${periodLabel}, before commission`}
              icon={<DollarSign className="h-5 w-5 text-green-600" />}
              accent="bg-green-200/40"
              path="/admin/payments"
            />
            <MetricCard
              loading={loading}
              title="Approved sellers"
              value={num(t.sellers)}
              helper="Store and horse sellers"
              icon={<Store className="h-5 w-5 text-purple-600" />}
              accent="bg-purple-200/40"
              path="/admin/horses/sellers"
            />
            <MetricCard
              loading={loading}
              title="Approvals pending"
              value={num(t.pendingApprovals)}
              helper="Providers and transporters awaiting review"
              icon={<UserCheck className="h-5 w-5 text-orange-600" />}
              accent="bg-orange-200/40"
              path="/admin/providers"
            />
            <MetricCard
              loading={loading}
              title="Open enquiries"
              value={num(t.openEnquiries)}
              helper="Horse buyers waiting for a reply"
              icon={<MessageSquare className="h-5 w-5 text-indigo-600" />}
              accent="bg-indigo-200/40"
              path="/admin/horses/inquiries"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              loading={loading}
              title="Platform commission"
              value={fmt(t.commissionEarned)}
              helper={`Earned ${periodLabel} across all bookings`}
              icon={<Percent className="h-5 w-5 text-teal-600" />}
              accent="bg-teal-200/40"
              path="/admin/commission/transporter"
            />
            <MetricCard
              loading={loading}
              title="Withdrawals to pay"
              value={num(t.pendingWithdrawals)}
              helper={`${fmt(t.pendingWithdrawalAmount)} waiting for approval or payment`}
              icon={<Wallet className="h-5 w-5 text-cyan-600" />}
              accent="bg-cyan-200/40"
              path="/admin/transport/withdrawals"
            />
            <MetricCard
              loading={loading}
              title="Live trips now"
              value={num(t.liveTrips)}
              helper="Transport trips scheduled or on the road"
              icon={<Navigation className="h-5 w-5 text-sky-600" />}
              accent="bg-sky-200/40"
              path="/admin/transport/tracking"
            />
            <MetricCard
              loading={loading}
              title="Low stock products"
              value={num(t.lowStockProducts)}
              helper="Five or fewer left in stock"
              icon={<PackageX className="h-5 w-5 text-red-600" />}
              accent="bg-red-200/40"
              path="/admin/store/products"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-0 lg:col-span-2">
              <CardContent className="p-5">
                <p className="mb-4 text-sm font-semibold text-neutral-900">Bookings & revenue, last 6 months</p>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data?.trend || []}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#92400e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#92400e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v, name) => (name === "revenue" ? fmt(v) : num(v))} />
                    <Area type="monotone" dataKey="revenue" name="revenue" stroke="#92400e" fill="url(#rev)" strokeWidth={2} />
                    <Area type="monotone" dataKey="bookings" name="bookings" stroke="#0ea5e9" fill="none" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="p-5">
                <p className="mb-4 text-sm font-semibold text-neutral-900">Booking status, {periodLabel}</p>
                {(data?.statusSplit || []).every((s) => s.value === 0) && !loading ? (
                  <div className="flex h-[280px] items-center justify-center text-sm text-neutral-500">No bookings {periodLabel}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={data?.statusSplit || []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                        {(data?.statusSplit || []).map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLOR[entry.name]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
