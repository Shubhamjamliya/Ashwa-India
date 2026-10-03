import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ShoppingBag } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useCart } from "../context/CartContext"
import PageHeader, { CartIconButton } from "../components/PageHeader"

export default function Store() {
  const navigate = useNavigate()
  const { totalCount: cartCount } = useCart()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([apiFetch("/store/products"), apiFetch("/store/categories")])
      .then(([productsRes, categoriesRes]) => {
        setProducts(productsRes.products || [])
        setCategories((categoriesRes.categories || []).filter((c) => c.status !== "inactive"))
      })
      .catch((err) => setError(err.message || "Failed to load store"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => (activeCategory ? products.filter((p) => p.category?._id === activeCategory) : products),
    [products, activeCategory]
  )

  return (
    <div className="pb-6">
      <PageHeader
        title="Accessories Store"
        right={<CartIconButton count={cartCount} onClick={() => navigate("/user/cart")} />}
      />

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          {[{ _id: "", name: "All" }, ...categories].map((c) => {
            const active = activeCategory === c._id
            return (
              <button
                key={c._id || "all"}
                onClick={() => setActiveCategory(c._id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold ${
                  active ? "border-[#0B1C33] bg-[#0B1C33] text-white" : "border-[#E4E1D8] bg-white text-[#0F2238]"
                }`}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : error ? (
        <p className="px-8 py-20 text-center text-sm text-destructive">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-8 py-20 text-center">
          <ShoppingBag className="h-7 w-7 text-neutral-400" />
          <p className="text-sm text-neutral-500">No products in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          {filtered.map((product) => (
            <button
              key={product._id}
              onClick={() => navigate(`/user/store/${product._id}`)}
              className="overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white pb-3 text-left"
            >
              <div className="flex h-[130px] w-full items-center justify-center bg-[#F1EEE6]">
                {product.photos?.[0] ? (
                  <img src={getMediaUrl(product.photos[0])} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <ShoppingBag className="h-[22px] w-[22px] text-neutral-400" />
                )}
              </div>
              <p className="mt-2 line-clamp-2 px-3 text-[13px] font-bold leading-[17px] text-[#0F2238]">{product.name}</p>
              <p className="mt-1 px-3 text-sm font-extrabold text-[#C28D2E]">₹{product.price?.toLocaleString("en-IN")}</p>
              {product.stock <= 0 && <p className="mt-0.5 px-3 text-[11px] text-destructive">Out of stock</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
