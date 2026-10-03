import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin, Plus, ShoppingBag } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useAuth } from "@/shared/context/AuthContext"
import { useCart } from "../context/CartContext"
import { useAddresses } from "../context/AddressContext"
import PageHeader from "../components/PageHeader"

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, totalAmount, clear } = useCart()
  const { selectedAddress } = useAddresses()
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState("")

  const handlePlaceOrder = async () => {
    if (items.length === 0 || !selectedAddress) return
    setPlacing(true)
    setError("")
    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) throw new Error("Could not load payment gateway. Check your connection.")

      const cartItems = items.map((i) => ({ productId: i.product._id, quantity: i.quantity }))
      const order = await apiFetch("/store/payments/razorpay-order", { method: "POST", body: { items: cartItems } })

      // One order per seller, same as the native app.
      const bySeller = new Map()
      for (const item of items) {
        const sellerId = item.product.seller._id
        if (!bySeller.has(sellerId)) bySeller.set(sellerId, [])
        bySeller.get(sellerId).push(item)
      }

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "Ashwa India",
        description: "Accessories Store purchase",
        prefill: { name: user?.name, contact: user?.phone },
        theme: { color: "#C28D2E" },
        handler: async (response) => {
          try {
            for (const sellerItems of bySeller.values()) {
              await apiFetch("/store/orders", {
                method: "POST",
                body: {
                  items: sellerItems.map((i) => ({ productId: i.product._id, quantity: i.quantity })),
                  shippingAddress: {
                    label: selectedAddress.label,
                    line1: selectedAddress.line1,
                    city: selectedAddress.city,
                    state: selectedAddress.state,
                    pincode: selectedAddress.pincode,
                    phone: user?.phone,
                  },
                  paymentIntentId: order.paymentIntentId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                },
              })
            }
            clear()
            navigate("/user/orders")
          } catch (err) {
            setError(err.message || "Failed to place order")
          } finally {
            setPlacing(false)
          }
        },
        modal: { ondismiss: () => setPlacing(false) },
      })
      razorpay.open()
    } catch (err) {
      setError(err.message || "Failed to start checkout")
      setPlacing(false)
    }
  }

  const addressText = selectedAddress
    ? [selectedAddress.line1, selectedAddress.city, selectedAddress.state, selectedAddress.pincode].filter(Boolean).join(", ")
    : ""

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col pb-6">
      <PageHeader title="Checkout" />

      <div className="flex-1 px-4 pb-4">
        <p className="mb-2 mt-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Delivery Address</p>
        {selectedAddress ? (
          <button
            onClick={() => navigate("/user/addresses/select")}
            className="flex w-full items-start gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-4 text-left"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6E9C9]">
              <MapPin className="h-[18px] w-[18px] text-[#C28D2E]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#0F2238]">{selectedAddress.label}</span>
              <span className="mt-0.5 line-clamp-2 block text-xs text-neutral-500">{addressText}</span>
              {user?.phone && <span className="mt-0.5 block text-xs text-neutral-500">{user.phone}</span>}
            </span>
            <span className="mt-0.5 text-xs font-bold text-[#C28D2E]">Change</span>
          </button>
        ) : (
          <button
            onClick={() => navigate("/user/addresses/select")}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#C28D2E] bg-white p-4 text-left"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6E9C9]">
              <Plus className="h-[18px] w-[18px] text-[#C28D2E]" />
            </span>
            <span className="text-sm font-bold text-[#C28D2E]">Add a delivery address</span>
          </button>
        )}

        <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-neutral-500">Order Summary</p>
        <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
          {items.map((item) => (
            <div key={item.product._id} className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F1EEE6]">
                {item.product.photos?.[0] ? (
                  <img src={getMediaUrl(item.product.photos[0])} alt={item.product.name} className="h-full w-full object-cover" />
                ) : (
                  <ShoppingBag className="h-4 w-4 text-neutral-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#0F2238]">{item.product.name}</p>
                <p className="text-[11px] text-neutral-500">Qty {item.quantity}</p>
              </div>
              <p className="text-[13px] font-bold text-[#0F2238]">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-[#E4E1D8] pt-3">
            <span className="text-sm text-neutral-500">Total</span>
            <span className="text-lg font-extrabold text-[#0F2238]">₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {error && <p className="mt-3 text-[13px] text-destructive">{error}</p>}
      </div>

      <div className="sticky bottom-0 border-t border-[#E4E1D8] bg-white p-4">
        <button
          onClick={handlePlaceOrder}
          disabled={!selectedAddress || items.length === 0 || placing}
          className="w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {placing ? "Processing payment..." : `Pay ₹${totalAmount.toLocaleString("en-IN")} & Place Order`}
        </button>
      </div>
    </div>
  )
}
