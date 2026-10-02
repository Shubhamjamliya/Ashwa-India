import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { useAuth } from "@/shared/context/AuthContext"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { useCart } from "../context/CartContext"

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
  const [address, setAddress] = useState({ line1: "", city: "", state: "", pincode: "" })
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState("")

  if (items.length === 0) {
    navigate("/user/cart", { replace: true })
    return null
  }

  const handlePlaceOrder = async () => {
    if (!address.line1.trim() || !address.city.trim()) {
      setError("Enter your delivery address")
      return
    }
    setError("")
    setPlacing(true)
    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) throw new Error("Could not load payment gateway. Check your connection.")

      const cartItems = items.map((i) => ({ productId: i.product._id, quantity: i.quantity }))
      const order = await apiFetch("/store/payments/razorpay-order", { method: "POST", body: { items: cartItems } })

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
            await apiFetch("/store/orders", {
              method: "POST",
              body: {
                items: cartItems,
                shippingAddress: { ...address, phone: user?.phone },
                paymentIntentId: order.paymentIntentId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            })
            clear()
            navigate("/user/orders")
          } catch (err) {
            setError(err.message || "Failed to place order")
          } finally {
            setPlacing(false)
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      })
      razorpay.open()
    } catch (err) {
      setError(err.message || "Failed to start checkout")
      setPlacing(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-600">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl font-extrabold text-[#0F2238]">Checkout</h1>

      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
        <p className="text-sm font-bold text-[#0F2238]">Delivery Address</p>
        <Input
          placeholder="House no., street, area"
          value={address.line1}
          onChange={(e) => setAddress((p) => ({ ...p, line1: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="City" value={address.city} onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))} />
          <Input placeholder="State" value={address.state} onChange={(e) => setAddress((p) => ({ ...p, state: e.target.value }))} />
        </div>
        <Input
          placeholder="Pincode"
          value={address.pincode}
          onChange={(e) => setAddress((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
        />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <p className="mb-3 text-sm font-bold text-[#0F2238]">Order Summary</p>
        {items.map(({ product, quantity }) => (
          <div key={product._id} className="flex items-center justify-between py-1 text-sm text-neutral-600">
            <span>
              {quantity} × {product.name}
            </span>
            <span>₹{(product.price * quantity).toLocaleString("en-IN")}</span>
          </div>
        ))}
        <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3 text-lg font-extrabold text-[#0F2238]">
          <span>Total</span>
          <span>₹{totalAmount.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button className="w-full" onClick={handlePlaceOrder} disabled={placing}>
        {placing ? "Processing..." : `Pay ₹${totalAmount.toLocaleString("en-IN")}`}
      </Button>
    </div>
  )
}
