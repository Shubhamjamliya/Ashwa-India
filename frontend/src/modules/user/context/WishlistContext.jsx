import { createContext, useContext, useEffect, useState } from "react"
import { apiFetch } from "@/shared/lib/api"

const WishlistContext = createContext(null)

// Saved horses live on the account, so they follow the user across devices.
// Toggles update the screen straight away and roll back if the server rejects them.
export function WishlistProvider({ children }) {
  const [horses, setHorses] = useState([])

  useEffect(() => {
    apiFetch("/marketplace/favourites")
      .then((data) => setHorses(data.horses || []))
      .catch(() => setHorses([]))
  }, [])

  const isSaved = (horseId) => horses.some((h) => h._id === horseId)

  const toggle = async (horse) => {
    const wasSaved = isSaved(horse._id)
    setHorses((prev) => (wasSaved ? prev.filter((h) => h._id !== horse._id) : [...prev, horse]))
    try {
      await apiFetch(`/marketplace/favourites/${horse._id}/toggle`, { method: "POST" })
    } catch {
      setHorses((prev) => (wasSaved ? [...prev, horse] : prev.filter((h) => h._id !== horse._id)))
    }
  }

  return <WishlistContext.Provider value={{ horses, isSaved, toggle }}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider")
  return ctx
}
