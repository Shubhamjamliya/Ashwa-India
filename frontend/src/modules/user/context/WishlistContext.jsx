import { createContext, useContext, useEffect, useState } from "react"

const WishlistContext = createContext(null)
const STORAGE_KEY = "ashwa_user_web_wishlist"

export function WishlistProvider({ children }) {
  const [horses, setHorses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(horses))
  }, [horses])

  const isSaved = (horseId) => horses.some((h) => h._id === horseId)

  const toggle = (horse) => {
    setHorses((prev) => (prev.some((h) => h._id === horse._id) ? prev.filter((h) => h._id !== horse._id) : [...prev, horse]))
  }

  return <WishlistContext.Provider value={{ horses, isSaved, toggle }}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider")
  return ctx
}
