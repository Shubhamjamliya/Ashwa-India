import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { CheckCircle2, MapPin, Stethoscope } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useLocationContext } from "../context/LocationContext"
import { useAddresses } from "../context/AddressContext"
import PageHeader from "../components/PageHeader"

// Checkout for selected services: one booking goes to every nearby provider, the first to accept gets it.
export default function ServiceCheckout() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { location } = useLocationContext()
  const { selectedAddress } = useAddresses()
  const services = state?.services || []
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  if (services.length === 0) return <Navigate to="/user/services" replace />

  const addressText = selectedAddress
    ? [selectedAddress.line1, selectedAddress.city, selectedAddress.state, selectedAddress.pincode].filter(Boolean).join(", ")
    : location?.label || ""

  const book = async () => {
    if (location?.lat == null) {
      setError("Set your location so we can find providers near you")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      await apiFetch("/services/requests/broadcast", {
        method: "POST",
        body: {
          serviceKeys: services.map((s) => s.key),
          message: message.trim() || undefined,
          address: addressText || undefined,
          coords: { lat: location.lat, lng: location.lng },
        },
      })
      setSent(true)
    } catch (err) {
      setError(err.message || "Could not place your booking")
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </span>
        <h2 className="text-lg font-extrabold text-[#0F2238]">Request sent</h2>
        <p className="text-[13px] text-neutral-500">Nearby providers have been notified. You'll get an update as soon as one accepts.</p>
        <button onClick={() => navigate("/user/bookings", { replace: true })} className="mt-3 rounded-2xl bg-[#0B1C33] px-8 py-3 text-sm font-bold text-white">
          View my bookings
        </button>
      </div>
    )
  }

  return (
    <div className="pb-28">
      <PageHeader title="Checkout" />

      <div className="space-y-4 px-4 pt-4">
        <section>
          <h2 className="mb-2 text-sm font-bold text-[#0F2238]">Selected services</h2>
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.key} className="flex items-center gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#E1ECFC]">
                  {s.image ? <img src={getMediaUrl(s.image)} alt="" className="h-full w-full object-cover" /> : <Stethoscope className="h-5 w-5 text-[#2563EB]" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#0F2238]">{s.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[#0F2238]">Service location</h2>
          <button onClick={() => navigate("/user/addresses/select")} className="flex w-full items-start gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-4 text-left">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#C28D2E]" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#0F2238]">{selectedAddress?.label || "Current location"}</span>
              <span className="block text-xs text-neutral-500">{addressText || "Tap to choose an address"}</span>
            </span>
            <span className="text-xs font-bold text-[#C28D2E]">Change</span>
          </button>
          <p className="mt-1.5 px-1 text-[11px] text-neutral-500">Providers are matched using your location: {location?.label || "not set"}.</p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-[#0F2238]">Notes for the provider (optional)</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Describe what you need, preferred time, etc."
            className="w-full resize-none rounded-2xl border border-[#E4E1D8] bg-white p-3 text-sm outline-none focus:border-[#C28D2E]"
          />
        </section>

        <p className="rounded-2xl bg-[#FBF6EC] p-3 text-[12px] leading-relaxed text-[#8A6416]">
          Your request goes to all available providers nearby. The first one to accept confirms the booking and sets the price.
        </p>
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 pt-2">
        <button
          onClick={book}
          disabled={submitting}
          className="w-full max-w-[480px] rounded-2xl bg-[#0B1C33] py-4 text-sm font-bold text-white shadow-xl active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Sending request..." : `Book ${services.length} service${services.length > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  )
}
