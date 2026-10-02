import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { Input } from "@/shared/components/ui/input"

export default function Marketplace() {
  const navigate = useNavigate()
  const [horses, setHorses] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState("")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [horsesRes, categoriesRes] = await Promise.allSettled([
        apiFetch("/marketplace/horses"),
        apiFetch("/marketplace/categories"),
      ])
      if (horsesRes.status === "fulfilled") setHorses(horsesRes.value.horses || [])
      if (categoriesRes.status === "fulfilled") setCategories(categoriesRes.value.categories || [])
      setLoading(false)
    })()
  }, [])

  const filtered = horses.filter((h) => {
    if (categoryId && h.category?._id !== categoryId) return false
    if (query && !h.breed?.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F2238]">Horse Marketplace</h1>
        <p className="text-sm text-neutral-500">Browse horses listed by sellers across India</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by breed..." className="pl-9" />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading horses...</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          No horses found.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((horse) => (
            <button
              key={horse._id}
              onClick={() => navigate(`/user/horses/${horse._id}`)}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left hover:shadow-md"
            >
              <div className="h-36 w-full bg-neutral-100">
                {horse.photos?.[0] && (
                  <img src={getMediaUrl(horse.photos[0])} alt={horse.breed} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-bold text-[#0F2238]">{horse.breed}</p>
                <p className="text-xs text-neutral-500">
                  {[horse.age ? `${horse.age} yrs` : null, horse.gender].filter(Boolean).join(" · ")}
                </p>
                <p className="truncate text-xs text-neutral-500">{horse.location}</p>
                <p className="mt-1 text-sm font-extrabold text-[#C28D2E]">₹{horse.price?.toLocaleString("en-IN")}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
