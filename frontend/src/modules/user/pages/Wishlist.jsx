import { useNavigate } from "react-router-dom"
import { Heart, MapPin, ShoppingBag } from "lucide-react"
import { getMediaUrl } from "@/shared/lib/media"
import { useWishlist } from "../context/WishlistContext"
import BackButton from "../components/BackButton"

// Saved horses and saved accessories, both kept on the account.
export default function Wishlist() {
  const navigate = useNavigate()
  const { horses, products, toggle, toggleProduct } = useWishlist()
  const empty = horses.length === 0 && products.length === 0

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <BackButton />
        <h1 className="text-lg font-bold text-[#0F2238]">Saved items</h1>
      </div>

      {empty ? (
        <div className="flex flex-col items-center gap-1.5 px-8 py-16 text-center">
          <Heart className="h-7 w-7 text-neutral-400" />
          <p className="text-sm font-semibold text-[#0F2238]">Nothing saved yet</p>
          <p className="text-xs text-neutral-500">Tap the heart on a horse or an accessory to save it here.</p>
        </div>
      ) : (
        <div className="space-y-5 px-4">
          {horses.length > 0 && (
            <section className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Horses</p>
              {horses.map((horse) => (
                <div key={horse._id} className="flex items-center overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white pr-2">
                  <button onClick={() => navigate(`/user/horses/${horse._id}`)} className="flex flex-1 items-center text-left">
                    <div className="h-[90px] w-[90px] shrink-0 bg-[#F1EEE6]">
                      {horse.photos?.[0] && <img src={getMediaUrl(horse.photos[0])} alt={horse.breed} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 space-y-0.5 p-3">
                      <p className="text-[15px] font-bold text-[#0F2238]">{horse.name || horse.breed}</p>
                      <p className="text-xs text-neutral-500">{horse.breed}</p>
                      {horse.location && (
                        <p className="flex items-center gap-1 text-xs text-neutral-500">
                          <MapPin className="h-3 w-3" />
                          {horse.location}
                        </p>
                      )}
                      <p className="mt-1 text-[15px] font-bold text-[#C28D2E]">
                        {horse.listingType === "lease"
                          ? `₹${horse.leaseRate?.toLocaleString("en-IN")} / ${horse.leasePeriod || "month"}`
                          : `₹${horse.price?.toLocaleString("en-IN")}`}
                      </p>
                    </div>
                  </button>
                  <button onClick={() => toggle(horse)} aria-label="Remove" className="flex h-9 w-9 items-center justify-center">
                    <Heart className="h-[18px] w-[18px] text-[#C28D2E]" fill="#C28D2E" />
                  </button>
                </div>
              ))}
            </section>
          )}

          {products.length > 0 && (
            <section className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Accessories</p>
              {products.map((product) => (
                <div key={product._id} className="flex items-center overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white pr-2">
                  <button onClick={() => navigate(`/user/store/${product._id}`)} className="flex flex-1 items-center text-left">
                    <div className="flex h-[90px] w-[90px] shrink-0 items-center justify-center bg-[#F1EEE6]">
                      {product.photos?.[0] ? <img src={getMediaUrl(product.photos[0])} alt={product.name} className="h-full w-full object-cover" /> : <ShoppingBag className="h-5 w-5 text-neutral-400" />}
                    </div>
                    <div className="flex-1 space-y-0.5 p-3">
                      <p className="line-clamp-2 text-[14px] font-bold text-[#0F2238]">{product.name}</p>
                      <p className="mt-1 text-[14px] font-bold text-[#C28D2E]">₹{product.price?.toLocaleString("en-IN")}</p>
                    </div>
                  </button>
                  <button onClick={() => toggleProduct(product)} aria-label="Remove" className="flex h-9 w-9 items-center justify-center">
                    <Heart className="h-[18px] w-[18px] text-[#C28D2E]" fill="#C28D2E" />
                  </button>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
