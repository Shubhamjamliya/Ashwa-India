import { createContext, useContext, useEffect, useState } from "react"

const CartContext = createContext(null)
const STORAGE_KEY = "ashwa_user_web_cart"

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product._id === product._id)
      if (existing) {
        return prev.map((i) => (i.product._id === product._id ? { ...i, quantity: i.quantity + quantity } : i))
      }
      return [...prev, { product, quantity }]
    })
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product._id !== productId))
      return
    }
    setItems((prev) => prev.map((i) => (i.product._id === productId ? { ...i, quantity } : i)))
  }

  const removeItem = (productId) => setItems((prev) => prev.filter((i) => i.product._id !== productId))
  const clear = () => setItems([])

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmount = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, totalCount, totalAmount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
