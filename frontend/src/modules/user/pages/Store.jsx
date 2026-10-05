import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, ShoppingBag, SlidersHorizontal, Star } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useCart } from "../context/CartContext"
import PageHeader, { CartIconButton } from "../components/PageHeader"
import { stockText } from "./ProductDetail"

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
]

const productStock = (p) => (p.variants?.length ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock)

export default function Store() {
  const navigate = useNavigate()
  const { totalCount: cartCount } = useCart()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState("")
  const [q, setQ] = useState("")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("newest")
  const [inStock, setInStock] = useState(false)
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/store/categories", { auth: false })
      .then((d) => setCategories((d.categories || []).filter((c) => c.status !== "inactive")))
      .catch(() => {})
  }, [])

  // Debounce typing so each keystroke doesn't hit the server.
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setLoading(true)
    setError("")
    const query = new URLSearchParams({ sort })
    if (activeCategory) query.set("category", activeCategory)
    if (q) query.set("q", q)
    if (inStock) query.set("inStock", "1")
    if (minPrice) query.set("minPrice", minPrice)
    if (maxPrice) query.set("maxPrice", maxPrice)
    apiFetch(`/store/products?${query}`, { auth: false })
      .then((d) => setProducts(d.products || []))
      .catch((err) => setError(err.message || "Failed to load products"))
      .finally(() => setLoading(false))
  }, [activeCategory, q, sort, inStock, minPrice, maxPrice])

  return (
    <div className="pb-6">
      <PageHeader title="Accessories Store" right={<CartIconButton count={cartCount} onClick={() => navigate("/user/cart")} />} />

      <div className="space-y-3 px-4 pb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="h-10 w-full rounded-xl border border-[#E4E1D8] bg-white pl-9 pr-3 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            aria-label="Filters"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${showFilters ? "border-[#0B1C33] bg-[#0B1C33] text-white" : "border-[#E4E1D8] bg-white text-[#0F2238]"}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {showFilters && (
          <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 text-[11px] font-semibold text-neutral-500">Min price</p>
                <input inputMode="numeric" value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))} className="h-9 w-full rounded-lg border border-[#E4E1D8] px-2 text-sm" placeholder="₹0" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold text-neutral-500">Max price</p>
                <input inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))} className="h-9 w-full rounded-lg border border-[#E4E1D8] px-2 text-sm" placeholder="Any" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#0F2238]">
                <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4 accent-amber-600" />
                In stock only
              </label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 rounded-lg border border-[#E4E1D8] bg-white px-2 text-xs">
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {categories.length > 0 && (
        <>
          <p className="px-4 pb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Shop by Category</p>
          <div className="flex gap-2 overflow-x-auto px-4 pb-3">
            {[{ _id: "", name: "All" }, ...categories].map((c) => {
              const active = activeCategory === c._id
              return (
                <button
                  key={c._id || "all"}
                  onClick={() => setActiveCategory(c._id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold ${active ? "border-[#0B1C33] bg-[#0B1C33] text-white" : "border-[#E4E1D8] bg-white text-[#0F2238]"}`}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
        </>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /></div>
      ) : error ? (
        <p className="px-8 py-20 text-center text-sm text-destructive">{error}</p>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-8 py-20 text-center">
          <ShoppingBag className="h-7 w-7 text-neutral-400" />
          <p className="text-sm text-neutral-500">No products match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          {products.map((product) => {
            const status = stockText(productStock(product))
            return (
              <button key={product._id} onClick={() => navigate(`/user/store/${product._id}`)} className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white pb-3 text-left">
                <div className="flex h-[130px] w-full items-center justify-center bg-[#F1EEE6]">
                  {product.photos?.[0] ? <img src={getMediaUrl(product.photos[0])} alt={product.name} className="h-full w-full object-cover" /> : <ShoppingBag className="h-[22px] w-[22px] text-neutral-400" />}
                </div>
                <p className="mt-2 line-clamp-2 px-3 text-[13px] font-bold leading-[17px] text-[#0F2238]">{product.name}</p>
                <p className="mt-1 px-3 text-sm font-extrabold text-[#C28D2E]">
                  ₹{product.price?.toLocaleString("en-IN")}
                  {product.variants?.length > 0 && <span className="text-[10px] font-semibold text-neutral-500"> · options</span>}
                </p>
                <div className="mt-0.5 flex items-center justify-between px-3">
                  <span className={`text-[11px] font-bold ${status.tone}`}>{status.text}</span>
                  {product.ratingCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-neutral-500"><Star className="h-3 w-3 fill-[#C28D2E] text-[#C28D2E]" />{product.ratingAverage.toFixed(1)}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
