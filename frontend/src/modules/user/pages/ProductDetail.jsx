import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useCart } from "../context/CartContext"
import { useWishlist } from "../context/WishlistContext"
import PageHeader, { CartIconButton } from "../components/PageHeader"

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

export function Stars({ value, size = "h-3.5 w-3.5" }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= Math.round(value) ? "fill-[#C28D2E] text-[#C28D2E]" : "text-neutral-300"}`} />
      ))}
    </span>
  )
}

// Stock wording shared with the shop cards.
export function stockText(stock) {
  if (stock <= 0) return { text: "Out of stock", tone: "text-destructive" }
  if (stock <= 5) return { text: `Only ${stock} left`, tone: "text-amber-600" }
  return { text: "In stock", tone: "text-emerald-600" }
}

function ReviewForm({ productId, onPosted }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    setSaving(true)
    setError("")
    try {
      await apiFetch("/store/reviews", { method: "POST", body: { productId, rating, comment: comment.trim() } })
      setRating(0)
      setComment("")
      onPosted()
    } catch (err) {
      setError(err.message || "Could not save your review")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-[#E4E1D8] p-3">
      <p className="text-xs font-bold text-[#0F2238]">Rate this product (after delivery)</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
            <Star className={`h-6 w-6 ${n <= rating ? "fill-[#C28D2E] text-[#C28D2E]" : "text-neutral-300"}`} />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="How did it work for you? (optional)"
            className="w-full resize-none rounded-xl border border-[#E4E1D8] px-3 py-2 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button onClick={submit} disabled={saving} className="w-full rounded-xl bg-[#0B1C33] py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Submit review"}
          </button>
        </>
      )}
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem, totalCount: cartCount } = useCart()
  const { isSavedProduct, toggleProduct } = useWishlist()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [variantId, setVariantId] = useState(null)
  const [addedNote, setAddedNote] = useState("")
  const [photo, setPhoto] = useState(0)

  const loadReviews = () =>
    apiFetch(`/store/reviews?productId=${id}`, { auth: false })
      .then((d) => setReviews(d.reviews || []))
      .catch(() => setReviews([]))

  useEffect(() => {
    setLoading(true)
    setError("")
    setVariantId(null)
    setQuantity(1)
    setPhoto(0)
    Promise.all([apiFetch(`/store/products/${id}`, { auth: false }), apiFetch(`/store/products/${id}/related`, { auth: false })])
      .then(([p, r]) => {
        setProduct(p.product)
        setRelated(r.products || [])
      })
      .catch((err) => setError(err.message || "Failed to load product"))
      .finally(() => setLoading(false))
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="pb-6">
        <PageHeader title="Product Details" />
        <div className="flex justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /></div>
      </div>
    )
  }
  if (error || !product) {
    return (
      <div className="pb-6">
        <PageHeader title="Product Details" />
        <p className="px-8 py-20 text-center text-sm text-destructive">{error || "Product not found"}</p>
      </div>
    )
  }

  const hasVariants = product.variants?.length > 0
  const variant = hasVariants ? product.variants.find((v) => v._id === variantId) || null : null
  const stock = variant ? variant.stock : product.stock
  const unitPrice = variant && variant.price != null ? variant.price : product.price
  const status = stockText(stock)
  const canBuy = stock > 0 && (!hasVariants || variant)
  const photos = product.photos || []
  const saved = isSavedProduct(product._id)

  const addToCart = () => {
    addItem(product, quantity, variant)
    setAddedNote("Added to cart")
    setTimeout(() => setAddedNote(""), 1800)
  }

  return (
    <div className="pb-8">
      <PageHeader
        title="Product Details"
        right={
          <div className="flex items-center gap-2">
            <button onClick={() => toggleProduct(product)} aria-label="Save product" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
              <Heart className="h-[18px] w-[18px] text-[#C28D2E]" fill={saved ? "#C28D2E" : "transparent"} />
            </button>
            <CartIconButton count={cartCount} onClick={() => navigate("/user/cart")} />
          </div>
        }
      />

      <div className="space-y-4 px-4">
        <div className="flex h-[240px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#F1EEE6]">
          {photos[photo] ? <img src={getMediaUrl(photos[photo])} alt={product.name} className="h-full w-full object-cover" /> : <ShoppingBag className="h-8 w-8 text-neutral-400" />}
        </div>
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {photos.map((url, i) => (
              <button key={url + i} onClick={() => setPhoto(i)} className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${i === photo ? "border-[#C28D2E]" : "border-transparent"}`}>
                <img src={getMediaUrl(url)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div>
          <p className="text-xl font-bold text-[#0F2238]">{product.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <Stars value={product.ratingAverage || 0} />
            <span className="text-xs text-neutral-500">{product.ratingCount ? `${product.ratingAverage.toFixed(1)} (${product.ratingCount} reviews)` : "No reviews yet"}</span>
          </div>
          <p className="mt-2 text-xl font-extrabold text-[#C28D2E]">{money(unitPrice)}</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-neutral-500">{product.category?.name}</span>
            <span className={`text-xs font-bold ${status.tone}`}>{status.text}</span>
          </div>
        </div>

        {hasVariants && (
          <div className="space-y-2">
            <p className="text-[13px] font-bold text-[#0F2238]">Choose an option</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const selected = v._id === variantId
                const out = v.stock <= 0
                return (
                  <button
                    key={v._id}
                    disabled={out}
                    onClick={() => {
                      setVariantId(v._id)
                      setQuantity(1)
                    }}
                    className={`rounded-full border px-3.5 py-2 text-xs font-semibold disabled:line-through disabled:opacity-40 ${selected ? "border-[#0B1C33] bg-[#0B1C33] text-white" : "border-[#E4E1D8] bg-white text-[#0F2238]"}`}
                  >
                    {v.label}
                  </button>
                )
              })}
            </div>
            {!variant && <p className="text-xs text-neutral-500">Pick an option to see its price and stock.</p>}
          </div>
        )}

        {product.description && <p className="text-sm leading-5 text-[#0F2238]">{product.description}</p>}

        <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">Sold by</p>
          <p className="text-[15px] font-bold text-[#0F2238]">{product.seller?.businessName || product.seller?.name}</p>
        </div>

        {canBuy && (
          <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold text-[#0F2238]">Quantity</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EEE6]" aria-label="Decrease">
                  <Minus className="h-4 w-4 text-[#0F2238]" />
                </button>
                <span className="min-w-6 text-center text-base font-bold text-[#0F2238]">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(stock, q + 1))} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EEE6]" aria-label="Increase">
                  <Plus className="h-4 w-4 text-[#0F2238]" />
                </button>
              </div>
            </div>
            {addedNote && <p className="text-[13px] font-semibold text-emerald-600">{addedNote}</p>}
            <div className="flex gap-2">
              <button onClick={addToCart} className="flex-1 rounded-xl border border-[#E4E1D8] bg-white py-3 text-sm font-bold text-[#0F2238]">
                Add to cart
              </button>
              <button
                onClick={() => {
                  addItem(product, quantity, variant)
                  navigate(`/user/checkout?seller=${product.seller?._id}`)
                }}
                className="flex-1 rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white"
              >
                Buy now · {money(unitPrice * quantity)}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <p className="text-[15px] font-bold text-[#0F2238]">Reviews & ratings</p>
          {reviews.length === 0 ? (
            <p className="text-xs text-neutral-500">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r._id} className="border-b border-[#E4E1D8] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-bold text-[#0F2238]">{r.buyer?.name || "Customer"}</p>
                    <Stars value={r.rating} />
                  </div>
                  {r.comment && <p className="mt-1 text-[12px] text-neutral-600">{r.comment}</p>}
                  <p className="mt-1 text-[10px] text-neutral-400">{fmt(r.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
          <ReviewForm productId={product._id} onPosted={loadReviews} />
        </div>

        {related.length > 0 && (
          <div>
            <p className="mb-2 text-[15px] font-bold text-[#0F2238]">Related products</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {related.map((p) => (
                <button key={p._id} onClick={() => navigate(`/user/store/${p._id}`)} className="w-[140px] shrink-0 overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white pb-2 text-left">
                  <div className="flex h-[100px] w-full items-center justify-center bg-[#F1EEE6]">
                    {p.photos?.[0] ? <img src={getMediaUrl(p.photos[0])} alt={p.name} className="h-full w-full object-cover" /> : <ShoppingBag className="h-5 w-5 text-neutral-400" />}
                  </div>
                  <p className="mt-2 line-clamp-2 px-2 text-[12px] font-bold text-[#0F2238]">{p.name}</p>
                  <p className="mt-0.5 px-2 text-xs font-extrabold text-[#C28D2E]">{money(p.price)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
