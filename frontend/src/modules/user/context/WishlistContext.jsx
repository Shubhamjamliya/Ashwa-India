import { createContext, useContext, useEffect, useState } from "react"
import { apiFetch } from "@/shared/lib/api"

const WishlistContext = createContext(null)

// Saved horses and saved products live on the account, so they follow the user across devices.
// Toggles update the screen straight away and roll back if the server rejects them.
export function WishlistProvider({ children }) {
  const [horses, setHorses] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    apiFetch("/marketplace/favourites")
      .then((data) => setHorses(data.horses || []))
      .catch(() => setHorses([]))
    apiFetch("/store/favourites")
      .then((data) => setProducts(data.products || []))
      .catch(() => setProducts([]))
  }, [])

  const isSaved = (horseId) => horses.some((h) => h._id === horseId)
  const isSavedProduct = (productId) => products.some((p) => p._id === productId)

  const toggle = async (horse) => {
    const wasSaved = isSaved(horse._id)
    setHorses((prev) => (wasSaved ? prev.filter((h) => h._id !== horse._id) : [...prev, horse]))
    try {
      await apiFetch(`/marketplace/favourites/${horse._id}/toggle`, { method: "POST" })
    } catch {
      setHorses((prev) => (wasSaved ? [...prev, horse] : prev.filter((h) => h._id !== horse._id)))
    }
  }

  const toggleProduct = async (product) => {
    const wasSaved = isSavedProduct(product._id)
    setProducts((prev) => (wasSaved ? prev.filter((p) => p._id !== product._id) : [...prev, product]))
    try {
      await apiFetch(`/store/favourites/${product._id}/toggle`, { method: "POST" })
    } catch {
      setProducts((prev) => (wasSaved ? [...prev, product] : prev.filter((p) => p._id !== product._id)))
    }
  }

  return (
    <WishlistContext.Provider value={{ horses, products, isSaved, toggle, isSavedProduct, toggleProduct }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider")
  return ctx
}
