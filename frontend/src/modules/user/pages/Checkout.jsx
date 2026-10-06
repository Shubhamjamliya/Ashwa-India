import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Banknote, CreditCard, MapPin, Plus, ShoppingBag, Wallet } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useAuth } from "@/shared/context/AuthContext"
import { useCart } from "../context/CartContext"
import { useAddresses } from "../context/AddressContext"
import PageHeader from "../components/PageHeader"

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`

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
  const [params] = useSearchParams()
  const { user } = useAuth()
  const { items, clearSeller } = useCart()
  const { selectedAddress } = useAddresses()

  const sellerId = params.get("seller")
  const couponCode = params.get("coupon") || undefined
  const lines = useMemo(() => items.filter((i) => i.product.seller?._id === sellerId), [items, sellerId])
  const payload = useMemo(
    () => lines.map((l) => ({ productId: l.product._id, variantId: l.variant?._id, quantity: l.quantity })),
    [lines]
  )

  const [preview, setPreview] = useState(null)
  const [options, setOptions] = useState({ razorpay: true, cod: false })
  const [method, setMethod] = useState("razorpay")
  const [walletBalance, setWalletBalance] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch("/store/payment-options", { auth: false }).then(setOptions).catch(() => {})
    apiFetch("/payments/wallet")
      .then((d) => setWalletBalance(Number(d.wallet?.balance) || 0))
      .catch(() => setWalletBalance(0))
  }, [])

  useEffect(() => {
    if (payload.length === 0) return
    apiFetch("/store/cart/preview", { method: "POST", body: { items: payload, couponCode } })
      .then(setPreview)
      .catch((err) => setError(err.message || "Could not price your order"))
  }, [payload, couponCode])

  const shippingAddress = selectedAddress
    ? {
        label: selectedAddress.label,
        line1: selectedAddress.line1,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        phone: user?.phone,
      }
    : null

  const finish = (order) => {
    clearSeller(sellerId)
    navigate(`/user/orders/${order._id}`, { replace: true })
  }

  const placeOrder = async () => {
    if (!shippingAddress) return setError("Choose a delivery address")
    setPlacing(true)
    setError("")
    try {
      if (method === "wallet") {
        const data = await apiFetch("/store/orders", {
          method: "POST",
          body: { items: payload, couponCode, method: "wallet", shippingAddress },
        })
        return finish(data.order)
      }
      if (method === "cod") {
        const data = await apiFetch("/store/orders", {
          method: "POST",
          body: { items: payload, couponCode, method: "cod", shippingAddress },
        })
        return finish(data.order)
      }

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) throw new Error("Could not load the payment gateway. Check your connection.")
      const intent = await apiFetch("/store/payments/razorpay-order", { method: "POST", body: { items: payload, couponCode } })

      const razorpay = new window.Razorpay({
        key: intent.keyId,
        amount: intent.amount,
        currency: intent.currency,
        order_id: intent.razorpayOrderId,
        name: "Ashwa India",
        description: "Accessories Store purchase",
        prefill: { name: user?.name, contact: user?.phone },
        theme: { color: "#C28D2E" },
        handler: async (response) => {
          try {
            const data = await apiFetch("/store/orders", {
              method: "POST",
              body: {
                items: payload,
                couponCode,
                method: "razorpay",
                shippingAddress,
                paymentIntentId: intent.paymentIntentId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            })
            finish(data.order)
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
      setError(err.message || "Failed to place order")
      setPlacing(false)
    }
  }

  if (!sellerId || lines.length === 0) {
    return (
      <div className="pb-6">
        <PageHeader title="Checkout" />
        <p className="px-8 py-16 text-center text-sm text-neutral-500">Nothing to check out. Go back to your cart.</p>
      </div>
    )
  }

  const sellerName = lines[0].product.seller?.businessName || lines[0].product.seller?.name || "Seller"

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col pb-6">
      <PageHeader title="Checkout" />

      <div className="flex-1 space-y-5 px-4 pb-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Delivery address</p>
          {selectedAddress ? (
            <button onClick={() => navigate("/user/addresses/select")} className="flex w-full items-start gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-4 text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6E9C9]">
                <MapPin className="h-[18px] w-[18px] text-[#C28D2E]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#0F2238]">{selectedAddress.label}</span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-neutral-500">
                  {[selectedAddress.line1, selectedAddress.city, selectedAddress.state, selectedAddress.pincode].filter(Boolean).join(", ")}
                </span>
              </span>
              <span className="mt-0.5 text-xs font-bold text-[#C28D2E]">Change</span>
            </button>
          ) : (
            <button onClick={() => navigate("/user/addresses/select")} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#C28D2E] bg-white p-4 text-left">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6E9C9]">
                <Plus className="h-[18px] w-[18px] text-[#C28D2E]" />
              </span>
              <span className="text-sm font-bold text-[#C28D2E]">Add a delivery address</span>
            </button>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Payment</p>
          <div className="space-y-2">
            {options.razorpay && (
              <PayOption active={method === "razorpay"} onClick={() => setMethod("razorpay")} icon={CreditCard} title="Pay online" hint="Cards, UPI, netbanking" />
            )}
            {walletBalance !== null && (
              <PayOption
                active={method === "wallet"}
                onClick={() => walletBalance >= (preview?.total || 0) && setMethod("wallet")}
                disabled={walletBalance < (preview?.total || 0)}
                icon={Wallet}
                title="Ashwa wallet"
                hint={walletBalance >= (preview?.total || 0) ? `Balance ${money(walletBalance)}` : `Balance ${money(walletBalance)} · not enough, add money in Wallet`}
              />
            )}
            {options.cod && (
              <PayOption active={method === "cod"} onClick={() => setMethod("cod")} icon={Banknote} title="Cash on delivery" hint="Pay when your order arrives" />
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Order summary · {sellerName}</p>
          <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
            {lines.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F1EEE6]">
                  {item.product.photos?.[0] ? <img src={getMediaUrl(item.product.photos[0])} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="h-4 w-4 text-neutral-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#0F2238]">{item.product.name}</p>
                  <p className="text-[11px] text-neutral-500">{item.variant ? `${item.variant.label} · ` : ""}Qty {item.quantity}</p>
                </div>
              </div>
            ))}
            <div className="space-y-1 border-t border-[#E4E1D8] pt-3 text-sm">
              <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span>{money(preview?.subtotal)}</span></div>
              {preview?.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Coupon {preview.couponCode}</span><span>− {money(preview.discount)}</span></div>}
              {preview?.gst?.amount > 0 && <div className="flex justify-between"><span>GST ({preview.gst.percent}%)</span><span>{money(preview.gst.amount)}</span></div>}
              <div className="flex justify-between text-base font-extrabold text-[#0F2238]"><span>Total</span><span>{money(preview?.total)}</span></div>
            </div>
          </div>
        </div>

        {error && <p className="text-[13px] text-destructive">{error}</p>}
      </div>

      <div className="sticky bottom-0 border-t border-[#E4E1D8] bg-white p-4">
        <button
          onClick={placeOrder}
          disabled={!shippingAddress || !preview || placing}
          className="w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {placing ? "Placing order..." : method === "cod" ? `Place order · pay ${money(preview?.total)} on delivery` : `Pay ${money(preview?.total)} & place order`}
        </button>
      </div>
    </div>
  )
}

function PayOption({ active, onClick, icon: Icon, title, hint, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left disabled:opacity-50 ${active ? "border-[#C28D2E] bg-[#FBF6EC]" : "border-[#E4E1D8] bg-white"}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6E9C9]"><Icon className="h-[18px] w-[18px] text-[#C28D2E]" /></span>
      <span className="flex-1">
        <span className="block text-sm font-bold text-[#0F2238]">{title}</span>
        <span className="block text-xs text-neutral-500">{hint}</span>
      </span>
      <span className={`h-4 w-4 rounded-full border-2 ${active ? "border-[#C28D2E] bg-[#C28D2E]" : "border-neutral-300"}`} />
    </button>
  )
}
