import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, MapPin, MessageSquare, Phone } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { Button } from "@/shared/components/ui/button"
import { Textarea } from "@/shared/components/ui/textarea"

export default function HorseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [horse, setHorse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    apiFetch(`/marketplace/horses/${id}`)
      .then((data) => setHorse(data.horse))
      .finally(() => setLoading(false))
  }, [id])

  const handleInquire = async () => {
    if (!message.trim()) {
      setError("Enter a message for the seller")
      return
    }
    setError("")
    setSending(true)
    try {
      await apiFetch("/marketplace/inquiries", { method: "POST", body: { horseId: id, message: message.trim() } })
      setSent(true)
    } catch (err) {
      setError(err.message || "Failed to send inquiry")
    } finally {
      setSending(false)
    }
  }

  if (loading) return <p className="text-sm text-neutral-500">Loading...</p>
  if (!horse) return <p className="text-sm text-neutral-500">Horse not found.</p>

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-600">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-2">
          {(horse.photos?.length ? horse.photos : [null]).map((photo, idx) => (
            <div key={idx} className="aspect-square overflow-hidden rounded-2xl bg-neutral-100">
              {photo && <img src={getMediaUrl(photo)} alt={horse.breed} className="h-full w-full object-cover" />}
            </div>
          ))}
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[#0F2238]">{horse.breed}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
            <MapPin className="h-4 w-4" /> {horse.location || "Location not specified"}
          </p>
          <p className="mt-3 text-3xl font-extrabold text-[#C28D2E]">₹{horse.price?.toLocaleString("en-IN")}</p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {horse.age && (
              <div className="rounded-xl border border-neutral-200 p-3">
                <p className="text-neutral-500">Age</p>
                <p className="font-bold text-[#0F2238]">{horse.age} years</p>
              </div>
            )}
            {horse.gender && (
              <div className="rounded-xl border border-neutral-200 p-3">
                <p className="text-neutral-500">Gender</p>
                <p className="font-bold capitalize text-[#0F2238]">{horse.gender}</p>
              </div>
            )}
            {horse.color && (
              <div className="rounded-xl border border-neutral-200 p-3">
                <p className="text-neutral-500">Color</p>
                <p className="font-bold text-[#0F2238]">{horse.color}</p>
              </div>
            )}
            {horse.height && (
              <div className="rounded-xl border border-neutral-200 p-3">
                <p className="text-neutral-500">Height</p>
                <p className="font-bold text-[#0F2238]">{horse.height} inch</p>
              </div>
            )}
          </div>

          {horse.description && (
            <div className="mt-4">
              <p className="mb-1 text-sm font-bold text-[#0F2238]">Description</p>
              <p className="text-sm text-neutral-600">{horse.description}</p>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-neutral-200 p-4">
            <p className="text-sm font-bold text-[#0F2238]">{horse.seller?.businessName || horse.seller?.name}</p>
            {horse.seller?.phone && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
                <Phone className="h-3.5 w-3.5" /> {horse.seller.phone}
              </p>
            )}
          </div>

          <div className="mt-5">
            {sent ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Inquiry sent to the seller!
              </p>
            ) : (
              <>
                <label className="mb-1.5 block text-sm font-bold text-[#0F2238]">Inquire about this horse</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="I'm interested in this horse..."
                  rows={3}
                />
                {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
                <Button onClick={handleInquire} disabled={sending} className="mt-3 w-full">
                  <MessageSquare className="h-4 w-4" />
                  {sending ? "Sending..." : "Send Inquiry"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
