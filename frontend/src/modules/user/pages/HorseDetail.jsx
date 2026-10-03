import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Heart, MapPin, Phone } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useWishlist } from "../context/WishlistContext"
import PageHeader from "../components/PageHeader"

function InfoChip({ label, value }) {
  return (
    <div className="rounded-xl bg-[#F6E9C9] px-2.5 py-1.5">
      <p className="text-[10px] text-[#8A6416]/70">{label}</p>
      <p className="text-[13px] font-semibold capitalize text-[#8A6416]">{value}</p>
    </div>
  )
}

export default function HorseDetail() {
  const { id } = useParams()
  const { isSaved, toggle } = useWishlist()
  const [horse, setHorse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState("")

  useEffect(() => {
    apiFetch(`/marketplace/horses/${id}`)
      .then((data) => setHorse(data.horse))
      .catch((err) => setError(err.message || "Failed to load listing"))
      .finally(() => setLoading(false))
  }, [id])

  const sendInquiry = async () => {
    if (!message.trim()) return
    setSending(true)
    setSendError("")
    try {
      await apiFetch("/marketplace/inquiries", { method: "POST", body: { horseId: id, message: message.trim() } })
      setSent(true)
      setMessage("")
    } catch (err) {
      setSendError(err.message || "Failed to send inquiry")
    } finally {
      setSending(false)
    }
  }

  const wishlistButton = horse && (
    <button
      type="button"
      onClick={() => toggle(horse)}
      aria-label="Save horse"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white"
    >
      <Heart className="h-[18px] w-[18px] text-[#C28D2E]" fill={isSaved(horse._id) ? "#C28D2E" : "transparent"} />
    </button>
  )

  return (
    <div className="pb-6">
      <PageHeader title="Horse Details" right={wishlistButton} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      ) : error || !horse ? (
        <p className="px-8 py-20 text-center text-sm text-destructive">{error || "Listing not found"}</p>
      ) : (
        <div className="px-4">
          <div className="h-[220px] w-full overflow-hidden rounded-2xl bg-[#F1EEE6]">
            {horse.photos?.[0] && <img src={getMediaUrl(horse.photos[0])} alt={horse.breed} className="h-full w-full object-cover" />}
          </div>

          <p className="mt-4 text-[22px] font-bold text-[#0F2238]">{horse.breed}</p>
          <p className="mt-1 text-lg font-bold text-[#C28D2E]">₹{horse.price?.toLocaleString("en-IN")}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {horse.age != null && <InfoChip label="Age" value={`${horse.age} yrs`} />}
            {horse.gender && <InfoChip label="Gender" value={horse.gender} />}
            {horse.color && <InfoChip label="Color" value={horse.color} />}
            {horse.height != null && <InfoChip label="Height" value={`${horse.height} hh`} />}
          </div>

          {horse.location && (
            <p className="mt-3 flex items-center gap-1 text-[13px] text-neutral-500">
              <MapPin className="h-3.5 w-3.5" />
              {horse.location}
            </p>
          )}

          {horse.description && <p className="mt-3 text-sm leading-5 text-[#0F2238]">{horse.description}</p>}

          <div className="mt-6 rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Seller</p>
            <p className="mt-0.5 text-[15px] font-bold text-[#0F2238]">{horse.seller?.businessName || horse.seller?.name}</p>
            {horse.seller?.phone && (
              <p className="mt-1 flex items-center gap-1 text-[13px] text-neutral-500">
                <Phone className="h-3.5 w-3.5" />
                {horse.seller.phone}
              </p>
            )}
          </div>

          <div className="mt-4 space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <p className="text-[15px] font-bold text-[#0F2238]">Interested in this horse?</p>
            {sent ? (
              <p className="text-sm text-emerald-600">Your inquiry has been sent to the seller.</p>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a message to the seller..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#E4E1D8] px-3 py-2 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
                />
                {sendError && <p className="text-[13px] text-destructive">{sendError}</p>}
                <button
                  onClick={sendInquiry}
                  disabled={!message.trim() || sending}
                  className="w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send Inquiry"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
