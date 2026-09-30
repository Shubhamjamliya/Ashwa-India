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
  ArrowUpRight, Package, ShoppingBag, Building2, Star, DollarSign, RotateCcw, AlertTriangle, Users,
} from "lucide-react"

const INR = "₹"
const fmt = (n) => `${INR}${Number(n || 0).toLocaleString("en-IN")}`

const monthlyData = [
  { month: "Jan", orders: 18, revenue: 32000 },
  { month: "Feb", orders: 24, revenue: 41000 },
  { month: "Mar", orders: 21, revenue: 38000 },
  { month: "Apr", orders: 33, revenue: 56000 },
  { month: "May", orders: 39, revenue: 64000 },
  { month: "Jun", orders: 30, revenue: 52000 },
]

const orderStatus = [
  { name: "Delivered", value: 96, fill: "#16a34a" },
  { name: "Processing", value: 21, fill: "#0ea5e9" },
  { name: "Pending", value: 9, fill: "#f59e0b" },
  { name: "Returned", value: 5, fill: "#ef4444" },
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

export default function StoreSellerDashboard() {
  const [period, setPeriod] = useState("overall")

  return (
    <div className="px-4 pb-10 lg:px-6 pt-4">
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_30px_120px_-60px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 border-b border-neutral-200 bg-gradient-to-br from-white via-neutral-50 to-neutral-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Seller Overview</p>
            <h1 className="text-2xl font-semibold text-neutral-900">Accessories Store Dashboard</h1>
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
              title="Active products"
              value="58"
              helper="Live in the catalog"
              icon={<Package className="h-5 w-5 text-purple-600" />}
              accent="bg-purple-200/40"
              path="/seller/store/products"
            />
            <MetricCard
              title="Pending orders"
              value="9"
              helper="Need to be fulfilled"
              icon={<ShoppingBag className="h-5 w-5 text-emerald-600" />}
              accent="bg-emerald-200/40"
              path="/seller/store/orders"
            />
            <MetricCard
              title="Low stock items"
              value="4"
              helper="Below reorder threshold"
              icon={<Building2 className="h-5 w-5 text-orange-600" />}
              accent="bg-orange-200/40"
              path="/seller/store/inventory"
            />
            <MetricCard
              title="Revenue"
              value={fmt(283000)}
              helper="This month's sales volume"
              icon={<DollarSign className="h-5 w-5 text-green-600" />}
              accent="bg-green-200/40"
              path="/seller/store/payments"
            />
            <MetricCard
              title="Returns"
              value="5"
              helper="Open return requests"
              icon={<RotateCcw className="h-5 w-5 text-rose-600" />}
              accent="bg-rose-200/40"
              path="/seller/store/returns"
            />
            <MetricCard
              title="Out of stock"
              value="2"
              helper="Products needing restock"
              icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
              accent="bg-amber-200/40"
              path="/seller/store/inventory"
            />
            <MetricCard
              title="Repeat customers"
              value="27"
              helper="Ordered more than once"
              icon={<Users className="h-5 w-5 text-blue-600" />}
              accent="bg-blue-200/40"
              path="/seller/store/orders"
            />
            <MetricCard
              title="Rating"
              value="4.5"
              helper="Based on 63 reviews"
              icon={<Star className="h-5 w-5 text-indigo-600" />}
              accent="bg-indigo-200/40"
              path="/seller/store/reviews"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-0">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-neutral-900 mb-4">Orders & revenue trend</p>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="storeRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#92400e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#92400e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#92400e" fill="url(#storeRev)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-neutral-900 mb-4">Order status</p>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={orderStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {orderStatus.map((entry, i) => (
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
