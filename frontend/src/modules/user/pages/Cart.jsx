import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Minus, Plus, ShoppingBag, Trash2, Tag } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useCart } from "../context/CartContext"
import PageHeader from "../components/PageHeader"

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`

// One block per seller: orders are split by seller, so each seller is checked out on its own.
function SellerGroup({ sellerId, sellerName, lines, onCheckout }) {
  const { updateQuantity, removeItem, unitPrice } = useCart()
  const [couponInput, setCouponInput] = useState("")
  const [coupon, setCoupon] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const payload = useMemo(
    () => lines.map((l) => ({ productId: l.product._id, variantId: l.variant?._id, quantity: l.quantity })),
    [lines]
  )

  useEffect(() => {
    setBusy(true)
    apiFetch("/store/cart/preview", { method: "POST", body: { items: payload, couponCode: coupon || undefined } })
      .then((p) => {
        setPreview(p)
        setError("")
      })
      .catch((err) => {
        // A bad coupon is dropped so the cart still checks out at full price.
        if (coupon) setCoupon(null)
        setPreview(null)
        setError(err.message || "Could not price the cart")
      })
      .finally(() => setBusy(false))
  }, [payload, coupon])

  const applyCoupon = (e) => {
    e.preventDefault()
    if (couponInput.trim()) setCoupon(couponInput.trim().toUpperCase())
  }

  return (
    <div className="space-y-2.5">
      <p className="px-1 text-xs font-bold uppercase tracking-wide text-neutral-500">Sold by {sellerName}</p>
      {lines.map((item) => (
        <div key={item.key} className="flex overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
          <div className="flex h-[90px] w-[90px] shrink-0 items-center justify-center bg-[#F1EEE6]">
            {item.product.photos?.[0] ? (
              <img src={getMediaUrl(item.product.photos[0])} alt={item.product.name} className="h-full w-full object-cover" />
            ) : (
              <ShoppingBag className="h-5 w-5 text-neutral-400" />
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between p-3">
            <div>
              <p className="line-clamp-2 text-sm font-bold text-[#0F2238]">{item.product.name}</p>
              {item.variant && <p className="text-[11px] text-neutral-500">{item.variant.label}</p>}
              <p className="mt-0.5 text-sm font-extrabold text-[#C28D2E]">{money(unitPrice(item))}</p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F1EEE6]" aria-label="Decrease">
                  <Minus className="h-3.5 w-3.5 text-[#0F2238]" />
                </button>
                <span className="min-w-[18px] text-center text-sm font-bold text-[#0F2238]">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F1EEE6]" aria-label="Increase">
                  <Plus className="h-3.5 w-3.5 text-[#0F2238]" />
                </button>
              </div>
              <button onClick={() => removeItem(item.key)} aria-label="Remove item">
                <Trash2 className="h-[18px] w-[18px] text-destructive" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="space-y-2 rounded-2xl border border-[#E4E1D8] bg-white p-4">
        <form onSubmit={applyCoupon} className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Coupon code"
              className="h-10 w-full rounded-xl border border-[#E4E1D8] pl-9 pr-3 text-sm uppercase text-[#0F2238] outline-none focus:border-[#C28D2E]"
            />
          </div>
          <button type="submit" className="rounded-xl border border-[#C28D2E] px-4 text-xs font-bold text-[#C28D2E]">
            Apply
          </button>
        </form>
        {coupon && preview?.couponCode && (
          <p className="text-xs font-bold text-emerald-700">
            {preview.couponCode} applied · you save {money(preview.discount)}
            <button onClick={() => { setCoupon(null); setCouponInput("") }} className="ml-2 text-neutral-500 underline">remove</button>
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="space-y-1 border-t border-[#E4E1D8] pt-2 text-sm">
          <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span>{money(preview?.subtotal)}</span></div>
          {preview?.discount > 0 && (
            <div className="flex justify-between text-emerald-700"><span>Discount</span><span>− {money(preview.discount)}</span></div>
          )}
          {preview?.gst?.amount > 0 && (
            <div className="flex justify-between"><span>GST ({preview.gst.percent}%)</span><span>{money(preview.gst.amount)}</span></div>
          )}
          <div className="flex justify-between text-base font-extrabold text-[#0F2238]">
            <span>Total</span>
            <span>{busy ? "…" : money(preview?.total)}</span>
          </div>
        </div>

        <button
          onClick={() => onCheckout({ sellerId, coupon: preview?.couponCode || undefined })}
          disabled={!preview || busy}
          className="w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Checkout from {sellerName}
        </button>
      </div>
    </div>
  )
}

export default function Cart() {
  const navigate = useNavigate()
  const { items } = useCart()

  const groups = useMemo(() => {
    const map = new Map()
    for (const item of items) {
      const sellerId = item.product.seller?._id || "unknown"
      if (!map.has(sellerId)) {
        map.set(sellerId, { sellerId, sellerName: item.product.seller?.businessName || item.product.seller?.name || "Seller", lines: [] })
      }
      map.get(sellerId).lines.push(item)
    }
    return [...map.values()]
  }, [items])

  const checkout = ({ sellerId, coupon }) => {
    const params = new URLSearchParams({ seller: sellerId })
    if (coupon) params.set("coupon", coupon)
    navigate(`/user/checkout?${params}`)
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col pb-6">
      <PageHeader title="Your Cart" />

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 px-8 text-center">
          <ShoppingBag className="h-8 w-8 text-neutral-400" />
          <p className="text-base font-semibold text-[#0F2238]">Your cart is empty</p>
          <p className="text-[13px] text-neutral-500">Browse the Accessories Store to add items.</p>
        </div>
      ) : (
        <div className="space-y-6 px-4">
          {groups.map((g) => (
            <SellerGroup key={g.sellerId} sellerId={g.sellerId} sellerName={g.sellerName} lines={g.lines} onCheckout={checkout} />
          ))}
        </div>
      )}
    </div>
  )
}
