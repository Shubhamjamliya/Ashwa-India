import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, ShoppingCart } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { Input } from "@/shared/components/ui/input"
import { useCart } from "../context/CartContext"

export default function Store() {
  const navigate = useNavigate()
  const { addItem, totalCount } = useCart()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState("")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [productsRes, categoriesRes] = await Promise.allSettled([
        apiFetch("/store/products"),
        apiFetch("/store/categories"),
      ])
      if (productsRes.status === "fulfilled") setProducts(productsRes.value.products || [])
      if (categoriesRes.status === "fulfilled") setCategories(categoriesRes.value.categories || [])
      setLoading(false)
    })()
  }, [])

  const filtered = products.filter((p) => {
    if (categoryId && p.category?._id !== categoryId) return false
    if (query && !p.name?.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F2238]">Accessories Store</h1>
          <p className="text-sm text-neutral-500">Everything your horse needs</p>
        </div>
        <button
          onClick={() => navigate("/user/cart")}
          className="relative rounded-full border border-neutral-200 bg-white p-3 hover:bg-neutral-50"
        >
          <ShoppingCart className="h-5 w-5 text-[#0F2238]" />
          {totalCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {totalCount > 9 ? "9+" : totalCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="pl-9" />
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
        <p className="text-sm text-neutral-500">Loading products...</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          No products found.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <div key={product._id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <button onClick={() => navigate(`/user/store/${product._id}`)} className="block w-full text-left">
                <div className="h-36 w-full bg-neutral-100">
                  {product.photos?.[0] && (
                    <img src={getMediaUrl(product.photos[0])} alt={product.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-bold text-[#0F2238]">{product.name}</p>
                  <p className="mt-1 text-sm font-extrabold text-[#C28D2E]">₹{product.price?.toLocaleString("en-IN")}</p>
                </div>
              </button>
              <button
                onClick={() => addItem(product)}
                disabled={product.stock <= 0}
                className="w-full border-t border-neutral-200 py-2 text-xs font-bold text-[#C28D2E] hover:bg-amber-50 disabled:text-neutral-300"
              >
                {product.stock <= 0 ? "Out of stock" : "Add to Cart"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
