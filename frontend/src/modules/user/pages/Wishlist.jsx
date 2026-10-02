import { useNavigate } from "react-router-dom"
import { ArrowLeft, Heart, MapPin } from "lucide-react"
import { getMediaUrl } from "@/shared/lib/media"
import { useWishlist } from "../context/WishlistContext"

export default function Wishlist() {
  const navigate = useNavigate()
  const { horses, toggle } = useWishlist()

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
          <ArrowLeft className="h-5 w-5 text-[#0F2238]" />
        </button>
        <h1 className="text-lg font-bold text-[#0F2238]">Saved Horses</h1>
      </div>

      {horses.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-8 py-16 text-center">
          <Heart className="h-7 w-7 text-neutral-400" />
          <p className="text-sm font-semibold text-[#0F2238]">No saved horses yet.</p>
          <p className="text-xs text-neutral-500">Tap the heart icon on any horse to shortlist it here.</p>
        </div>
      ) : (
        <div className="space-y-2.5 px-4">
          {horses.map((horse) => (
            <div key={horse._id} className="flex items-center overflow-hidden rounded-2xl border border-[#E4E1D8] bg-white pr-2">
              <button onClick={() => navigate(`/user/horses/${horse._id}`)} className="flex flex-1 items-center text-left">
                <div className="h-[90px] w-[90px] shrink-0 bg-[#F1EEE6]">
                  {horse.photos?.[0] && <img src={getMediaUrl(horse.photos[0])} alt={horse.breed} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 space-y-0.5 p-3">
                  <p className="text-[15px] font-bold text-[#0F2238]">{horse.breed}</p>
                  <p className="text-xs text-neutral-500">{horse.category?.name}</p>
                  {horse.location && (
                    <p className="flex items-center gap-1 text-xs text-neutral-500">
                      <MapPin className="h-3 w-3" />
                      {horse.location}
                    </p>
                  )}
                  <p className="mt-1 text-[15px] font-bold text-[#C28D2E]">₹{horse.price?.toLocaleString("en-IN")}</p>
                </div>
              </button>
              <button onClick={() => toggle(horse)} className="flex h-9 w-9 items-center justify-center">
                <Heart className="h-[18px] w-[18px] text-[#C28D2E]" fill="#C28D2E" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
