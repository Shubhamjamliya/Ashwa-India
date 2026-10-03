import { useNavigate } from "react-router-dom"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { getMediaUrl } from "@/shared/lib/media"
import { useCart } from "../context/CartContext"
import PageHeader from "../components/PageHeader"

export default function Cart() {
  const navigate = useNavigate()
  const { items, totalAmount, removeItem, updateQuantity } = useCart()

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
        <div className="flex-1 space-y-2.5 px-4">
          {items.map((item) => (
            <div key={item.product._id} className="flex overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white">
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
                  <p className="mt-0.5 text-sm font-extrabold text-[#C28D2E]">₹{item.product.price?.toLocaleString("en-IN")}</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F1EEE6]"
                    >
                      <Minus className="h-3.5 w-3.5 text-[#0F2238]" />
                    </button>
                    <span className="min-w-[18px] text-center text-sm font-bold text-[#0F2238]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F1EEE6]"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#0F2238]" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.product._id)} aria-label="Remove item">
                    <Trash2 className="h-[18px] w-[18px] text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="sticky bottom-0 mt-4 space-y-3 border-t border-[#E4E1D8] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">Total</span>
            <span className="text-lg font-extrabold text-[#0F2238]">₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>
          <button
            onClick={() => navigate("/user/checkout")}
            className="w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white"
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  )
}
