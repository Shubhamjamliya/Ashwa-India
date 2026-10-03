import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Heart, MapPin } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useWishlist } from "../context/WishlistContext"
import PageHeader from "../components/PageHeader"

export default function Marketplace() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { isSaved, toggle } = useWishlist()
  const [horses, setHorses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const category = params.get("category")
  const location = params.get("location")
  const [tab, setTab] = useState("all")

  // Quick tabs map onto listing filters, so the same server filters serve the app and the API.
  const TABS = [
    { key: "all", label: "All", filter: {} },
    { key: "stallions", label: "Stallions", filter: { gender: "stallion" } },
    { key: "foals", label: "Foals", filter: { maxAge: "1" } },
    { key: "lease", label: "For lease", filter: { listingType: "lease" } },
  ]

  const load = async () => {
    setError("")
    try {
      const query = new URLSearchParams()
      if (category) query.set("category", category)
      if (location) query.set("location", location)
      Object.entries(TABS.find((t) => t.key === tab).filter).forEach(([k, v]) => query.set(k, v))
      const qs = query.toString()
      const data = await apiFetch(`/marketplace/horses${qs ? `?${qs}` : ""}`)
      setHorses(data.horses || [])
    } catch (err) {
      setError(err.message || "Failed to load listings")
    }
  }

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, location, tab])

  return (
    <div className="pb-6">
      <PageHeader title="Horse Marketplace" />

      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold ${
              tab === t.key ? "border-[#0B1C33] bg-[#0B1C33] text-white" : "border-[#E4E1D8] bg-white text-[#0F2238]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : error ? (
        <p className="px-8 py-20 text-center text-sm text-destructive">{error}</p>
      ) : horses.length === 0 ? (
        <p className="px-8 py-20 text-center text-sm text-neutral-500">No horses listed yet.</p>
      ) : (
        <div className="space-y-2.5 px-4">
          {horses.map((horse) => (
            <button
              key={horse._id}
              onClick={() => navigate(`/user/horses/${horse._id}`)}
              className="flex w-full overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white text-left"
            >
              <div className="relative h-24 w-24 shrink-0 bg-[#F1EEE6]">
                {horse.photos?.[0] && <img src={getMediaUrl(horse.photos[0])} alt={horse.breed} className="h-full w-full object-cover" />}
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(horse)
                  }}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#0F2238]/55"
                >
                  <Heart className="h-3.5 w-3.5 text-white" fill={isSaved(horse._id) ? "white" : "transparent"} />
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-3">
                <p className="truncate text-[15px] font-bold text-[#0F2238]">{horse.breed}</p>
                <p className="truncate text-xs text-neutral-500">{horse.category?.name}</p>
                {horse.location && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-500">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {horse.location}
                  </p>
                )}
                <p className="mt-1 text-[15px] font-bold text-[#C28D2E]">
                  {horse.listingType === "lease"
                    ? `₹${horse.leaseRate?.toLocaleString("en-IN")} / ${horse.leasePeriod || "month"}`
                    : `₹${horse.price?.toLocaleString("en-IN")}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
