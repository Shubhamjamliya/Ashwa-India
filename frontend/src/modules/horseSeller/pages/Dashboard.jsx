import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Heart, MessageSquare, ShoppingBag, Star, ArrowUpRight } from "lucide-react"

const INR = "₹"
const fmt = (n) => `${INR}${Number(n || 0).toLocaleString("en-IN")}`

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
  return (
    <div className="px-4 pb-10 lg:px-6 pt-4">
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm px-6 py-6">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Seller Overview</p>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Horse Marketplace Dashboard</h1>

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
            title="New inquiries"
            value="6"
            helper="Awaiting your reply"
            icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
            accent="bg-blue-200/40"
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
            title="Rating"
            value="4.7"
            helper="Based on 21 reviews"
            icon={<Star className="h-5 w-5 text-amber-600" />}
            accent="bg-amber-200/40"
            path="/seller/horses/reviews"
          />
        </div>
      </div>
    </div>
  )
}
