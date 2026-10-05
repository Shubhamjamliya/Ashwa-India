import { createContext, useContext, useEffect, useState } from "react"

const CartContext = createContext(null)
const STORAGE_KEY = "ashwa_user_web_cart"

// A cart line is one product in one option (variant), so the same product can appear in several sizes.
export const lineKey = (productId, variantId) => `${productId}:${variantId || ""}`

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      // Carts saved before variants existed have no line key; they're dropped rather than shown broken.
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").filter((i) => i.key && i.product?._id)
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (product, quantity = 1, variant = null) => {
    const key = lineKey(product._id, variant?._id)
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key)
      if (existing) return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i))
      return [...prev, { key, product, variant, quantity }]
    })
  }

  const updateQuantity = (key, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.key !== key))
      return
    }
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity } : i)))
  }

  const removeItem = (key) => setItems((prev) => prev.filter((i) => i.key !== key))

  // Removes only the lines for one seller, so a checkout for one seller leaves the others in the cart.
  const clearSeller = (sellerId) => setItems((prev) => prev.filter((i) => i.product.seller?._id !== sellerId))

  const unitPrice = (i) => (i.variant && i.variant.price != null ? i.variant.price : i.product.price)
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0)
  // Display only. The server prices every order again before charging.
  const totalAmount = items.reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearSeller, unitPrice, totalCount, totalAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
