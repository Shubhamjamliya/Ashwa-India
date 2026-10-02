import { useNavigate } from "react-router-dom"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { getMediaUrl } from "@/shared/lib/media"
import { Button } from "@/shared/components/ui/button"
import { useCart } from "../context/CartContext"

export default function Cart() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, totalAmount } = useCart()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white py-16 text-center">
        <ShoppingBag className="mb-3 h-10 w-10 text-neutral-300" />
        <h2 className="text-lg font-bold text-[#0F2238]">Your cart is empty</h2>
        <p className="mb-4 text-sm text-neutral-500">Add some accessories to get started.</p>
        <Button onClick={() => navigate("/user/store")}>Browse Store</Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-[#0F2238]">Your Cart</h1>

      <div className="space-y-3">
        {items.map(({ product, quantity }) => (
          <div key={product._id} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
              {product.photos?.[0] && (
                <img src={getMediaUrl(product.photos[0])} alt={product.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#0F2238]">{product.name}</p>
              <p className="text-sm font-extrabold text-[#C28D2E]">₹{product.price?.toLocaleString("en-IN")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(product._id, quantity - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-bold">{quantity}</span>
              <button
                onClick={() => updateQuantity(product._id, quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button onClick={() => removeItem(product._id)} className="text-rose-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between text-lg font-extrabold text-[#0F2238]">
          <span>Total</span>
          <span>₹{totalAmount.toLocaleString("en-IN")}</span>
        </div>
        <Button className="mt-4 w-full" onClick={() => navigate("/user/checkout")}>
          Proceed to Checkout
        </Button>
      </div>
    </div>
  )
}
