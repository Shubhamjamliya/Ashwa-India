import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Download, MapPin, Truck } from "lucide-react"
import { apiFetch, apiBlob } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import BackButton from "../components/BackButton"
import { ORDER_STATUS, money } from "./Orders"

const when = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

// Order detail: progress timeline, courier tracking, items, totals and the invoice.
export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState("")
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    apiFetch(`/store/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch((err) => setError(err.message || "Could not load this order"))
  }, [id])

  const downloadInvoice = async () => {
    setDownloading(true)
    try {
      const blob = await apiBlob(`/store/orders/${id}/invoice`)
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloading(false)
    }
  }

  const header = (
    <div className="flex items-center gap-2 px-4 pb-3 pt-4">
      <BackButton />
      <h1 className="text-[17px] font-bold text-[#0F2238]">Order details</h1>
    </div>
  )

  if (error && !order) return <div className="pb-6">{header}<p className="px-8 py-16 text-center text-sm text-destructive">{error}</p></div>
  if (!order) return <div className="pb-6">{header}<div className="flex justify-center py-20"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /></div></div>

  const meta = ORDER_STATUS[order.status] || ORDER_STATUS.pending
  const terminal = ["cancelled", "returned"].includes(order.status)
  const steps = ["pending", "processing", "shipped", "delivered"]
  const reached = (s) => steps.indexOf(order.status) >= steps.indexOf(s)
  const address = order.shippingAddress
    ? [order.shippingAddress.line1, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode].filter(Boolean).join(", ")
    : ""

  return (
    <div className="space-y-4 pb-8">
      {header}
      <div className="space-y-4 px-4">
        <div className="flex items-center justify-between rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <div>
            <p className="text-sm font-bold text-[#0F2238]">Order #{order._id.slice(-6).toUpperCase()}</p>
            <p className="text-xs text-neutral-500">{order.seller?.businessName || order.seller?.name}</p>
          </div>
          <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>{meta.label}</span>
        </div>

        {!terminal ? (
          <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Tracking</p>
            <ol className="space-y-3">
              {steps.map((s, i) => {
                const done = reached(s)
                const entry = (order.statusHistory || []).find((h) => h.status === s)
                return (
                  <li key={s} className="flex gap-3">
                    <span className="flex flex-col items-center">
                      <span className={`h-3.5 w-3.5 rounded-full ${done ? "bg-[#C28D2E]" : "bg-[#E4E1D8]"}`} />
                      {i < steps.length - 1 && <span className={`mt-1 w-0.5 flex-1 ${done && reached(steps[i + 1]) ? "bg-[#C28D2E]" : "bg-[#E4E1D8]"}`} style={{ minHeight: 18 }} />}
                    </span>
                    <span className="pb-1">
                      <span className={`block text-[13px] font-bold ${done ? "text-[#0F2238]" : "text-neutral-400"}`}>{ORDER_STATUS[s].label}</span>
                      {entry && <span className="text-[11px] text-neutral-500">{when(entry.at)}</span>}
                    </span>
                  </li>
                )
              })}
            </ol>
            {order.courier?.trackingNumber && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F1EEE6] p-3 text-[13px]">
                <Truck className="h-4 w-4 text-[#C28D2E]" />
                <span>
                  {order.courier.name ? `${order.courier.name} · ` : ""}Tracking no. <b>{order.courier.trackingNumber}</b>
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4 text-sm text-neutral-600">
            This order was {order.status}.
            {(order.statusHistory || []).slice(-1).map((h) => (
              <span key={h.at} className="block text-[11px] text-neutral-500">{when(h.at)}{h.note ? ` · ${h.note}` : ""}</span>
            ))}
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Items</p>
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F1EEE6]">
                {item.product?.photos?.[0] && <img src={getMediaUrl(item.product.photos[0])} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#0F2238]">{item.product?.name || "Item"}</p>
                <p className="text-[11px] text-neutral-500">{item.variantLabel ? `${item.variantLabel} · ` : ""}Qty {item.quantity}</p>
              </div>
              <p className="text-[13px] font-bold text-[#0F2238]">{money(item.price * item.quantity)}</p>
            </div>
          ))}
          <div className="space-y-1 border-t border-[#E4E1D8] pt-3 text-sm">
            <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span>{money(order.subtotal ?? order.total + (order.discount || 0))}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Coupon {order.couponCode}</span><span>− {money(order.discount)}</span></div>}
            <div className="flex justify-between text-base font-extrabold text-[#0F2238]"><span>Total</span><span>{money(order.total)}</span></div>
            <div className="text-xs text-neutral-500">{order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online"}</div>
          </div>
        </div>

        {address && (
          <div className="flex items-start gap-2 rounded-2xl border border-[#E4E1D8] bg-white p-4 text-[13px] text-[#0F2238]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C28D2E]" />
            <span>{order.shippingAddress.label ? `${order.shippingAddress.label}: ` : ""}{address}</span>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
        <button onClick={downloadInvoice} disabled={downloading} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#0B1C33] bg-white py-3 text-sm font-bold text-[#0B1C33] disabled:opacity-50">
          <Download className="h-4 w-4" />
          {downloading ? "Preparing invoice..." : "Download invoice"}
        </button>
      </div>
    </div>
  )
}
