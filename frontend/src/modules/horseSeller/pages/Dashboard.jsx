import { useState } from "react"
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
  ArrowUpRight, Heart, MessageSquare, ShoppingBag, Star, Eye, Clock, DollarSign, Package,
} from "lucide-react"

const INR = "₹"
const fmt = (n) => `${INR}${Number(n || 0).toLocaleString("en-IN")}`

const monthlyData = [
  { month: "Jan", views: 120, sales: 1 },
  { month: "Feb", views: 180, sales: 2 },
  { month: "Mar", views: 150, sales: 1 },
  { month: "Apr", views: 240, sales: 3 },
  { month: "May", views: 300, sales: 4 },
  { month: "Jun", views: 260, sales: 2 },
]

const listingStatus = [
  { name: "Live", value: 14, fill: "#16a34a" },
  { name: "Pending review", value: 3, fill: "#f59e0b" },
  { name: "Sold", value: 6, fill: "#0ea5e9" },
  { name: "Removed", value: 2, fill: "#ef4444" },
]

function MetricCard({ title, value, helper, icon, accent, path }) {
  const navigate = useNavigate()
  return (
    <Card
      className="group relative overflow-hidden p-0 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]"
      onClick={() => path && navigate(path)}
    >
      <CardContent className="relative flex flex-col gap-2 px-4 pb-4 pt-4">
        <div className={`absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-60 ${accent}`} />
        <div className="relative flex items-center justify-between z-10">
          <div className="flex-1 min-w-0 mr-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-bold mb-1 truncate">{title}</p>
            <p className="text-xl font-bold text-neutral-900 leading-tight mb-1">{value}</p>
            <p className="text-[10px] text-neutral-500 font-medium line-clamp-1">{helper}</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 ring-1 ring-neutral-200 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
            {icon}
          </div>
        </div>
        <div className="absolute bottom-2 right-2 opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          <ArrowUpRight className="h-3 w-3 text-neutral-400" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function HorseSellerDashboard() {
  const [period, setPeriod] = useState("overall")

  return (
    <div className="px-4 pb-10 lg:px-6 pt-4">
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_30px_120px_-60px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 border-b border-neutral-200 bg-gradient-to-br from-white via-neutral-50 to-neutral-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Seller Overview</p>
            <h1 className="text-2xl font-semibold text-neutral-900">Horse Marketplace Dashboard</h1>
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="My listings"
              value="14"
              helper="Live horse listings"
              icon={<Heart className="h-5 w-5 text-rose-600" />}
              accent="bg-rose-200/40"
              path="/seller/horses/listings"
            />
            <MetricCard
              title="Total views"
              value="1,250"
              helper="Across all listings this month"
              icon={<Eye className="h-5 w-5 text-blue-600" />}
              accent="bg-blue-200/40"
              path="/seller/horses/listings"
            />
            <MetricCard
              title="New inquiries"
              value="6"
              helper="Awaiting your reply"
              icon={<MessageSquare className="h-5 w-5 text-amber-600" />}
              accent="bg-amber-200/40"
              path="/seller/horses/inquiries"
            />
            <MetricCard
              title="Orders"
              value="3"
              helper="Completed sales this month"
              icon={<ShoppingBag className="h-5 w-5 text-emerald-600" />}
              accent="bg-emerald-200/40"
              path="/seller/horses/orders"
            />
            <MetricCard
              title="Revenue"
              value={fmt(186000)}
              helper="This month's sales volume"
              icon={<DollarSign className="h-5 w-5 text-green-600" />}
              accent="bg-green-200/40"
              path="/seller/horses/payments"
            />
            <MetricCard
              title="Pending review"
              value="3"
              helper="Listings awaiting admin approval"
              icon={<Clock className="h-5 w-5 text-orange-600" />}
              accent="bg-orange-200/40"
              path="/seller/horses/listings"
            />
            <MetricCard
              title="Sold this year"
              value="9"
              helper="Total completed sales"
              icon={<Package className="h-5 w-5 text-purple-600" />}
              accent="bg-purple-200/40"
              path="/seller/horses/orders"
            />
            <MetricCard
              title="Rating"
              value="4.7"
              helper="Based on 21 reviews"
              icon={<Star className="h-5 w-5 text-indigo-600" />}
              accent="bg-indigo-200/40"
              path="/seller/horses/reviews"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-0">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-neutral-900 mb-4">Views & sales trend</p>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="views" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#92400e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#92400e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="views" stroke="#92400e" fill="url(#views)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-neutral-900 mb-4">Listing status</p>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={listingStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {listingStatus.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
