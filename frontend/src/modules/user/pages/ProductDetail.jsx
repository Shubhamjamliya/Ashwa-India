import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Minus, Plus, ShoppingBag } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useCart } from "../context/CartContext"
import PageHeader, { CartIconButton } from "../components/PageHeader"

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem, totalCount: cartCount } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    apiFetch(`/store/products/${id}`)
      .then((data) => setProduct(data.product))
      .catch((err) => setError(err.message || "Failed to load product"))
      .finally(() => setLoading(false))
  }, [id])

  const inStock = (product?.stock ?? 0) > 0

  const handleAddToCart = () => {
    addItem(product, quantity)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 1800)
  }

  const handleBuyNow = () => {
    addItem(product, quantity)
    navigate("/user/checkout")
  }

  return (
    <div className="pb-6">
      <PageHeader
        title="Product Details"
        right={<CartIconButton count={cartCount} onClick={() => navigate("/user/cart")} />}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : error || !product ? (
        <p className="px-8 py-20 text-center text-sm text-destructive">{error || "Product not found"}</p>
      ) : (
        <div className="px-4">
          <div className="flex h-[220px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#F1EEE6]">
            {product.photos?.[0] ? (
              <img src={getMediaUrl(product.photos[0])} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <ShoppingBag className="h-8 w-8 text-neutral-400" />
            )}
          </div>

          <p className="mt-4 text-xl font-bold text-[#0F2238]">{product.name}</p>
          <p className="mt-1 text-xl font-extrabold text-[#C28D2E]">₹{product.price?.toLocaleString("en-IN")}</p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-neutral-500">{product.category?.name}</span>
            <span className={`text-xs font-semibold ${inStock ? "text-emerald-600" : "text-destructive"}`}>
              {inStock ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>

          {product.description && <p className="mt-4 text-sm leading-5 text-[#0F2238]">{product.description}</p>}

          <div className="mt-6 rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Sold by</p>
            <p className="mt-0.5 text-[15px] font-bold text-[#0F2238]">{product.seller?.businessName || product.seller?.name}</p>
          </div>

          {inStock && (
            <div className="mt-4 space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
              <p className="text-[13px] font-bold text-[#0F2238]">Quantity</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EEE6]"
                >
                  <Minus className="h-4 w-4 text-[#0F2238]" />
                </button>
                <span className="min-w-6 text-center text-base font-bold text-[#0F2238]">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EEE6]"
                >
                  <Plus className="h-4 w-4 text-[#0F2238]" />
                </button>
              </div>

              {addedToCart && <p className="text-[13px] font-semibold text-emerald-600">Added to cart!</p>}

              <div className="flex gap-2">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 rounded-xl border border-[#E4E1D8] bg-white py-3 text-sm font-bold text-[#0F2238]"
                >
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white"
                >
                  Buy Now · ₹{(product.price * quantity).toLocaleString("en-IN")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
