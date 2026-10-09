import { useState } from "react"
import { CheckCircle2, Clock, ShieldCheck, Star, XCircle } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

// Building blocks shared by the transport bookings list and the booking detail page.

export const STATUS_META = {
  pending: { label: "Waiting for response", color: "#f59e0b", icon: Clock },
  accepted: { label: "Accepted", color: "#16a34a", icon: CheckCircle2 },
  completed: { label: "Delivered", color: "#0B1C33", icon: CheckCircle2 },
  rejected: { label: "Declined", color: "#ef4444", icon: XCircle },
  cancelled: { label: "Cancelled", color: "#64748B", icon: XCircle },
}

export const STAGE_TEXT = {
  scheduled: "Booking confirmed. The transporter will start soon.",
  to_pickup: "The transporter is on the way to pick up your horse.",
  in_transit: "Your horse is on the way to the drop-off.",
  delivered: "Delivered.",
}

export const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
export const dateLabel = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })

// Why a booking is still pending, in the user's words.
export function pendingText(item) {
  if (item.hostRequest && item.shareApproval === "pending") return "Waiting for the other customer to agree to share"
  if (item.hostRequest) return "The other customer agreed. Waiting for the transporter"
  if (!item.transporter) return "Finding a transporter near you. The first to accept gets your booking"
  return null
}

// Lets the user call off a request no transporter has accepted yet; the advance goes back to the wallet.
export function CancelPending({ id, onCancelled }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const cancel = async () => {
    if (!window.confirm("Cancel this request? Any advance goes back to your wallet.")) return
    setBusy(true)
    setError("")
    try {
      const d = await apiFetch(`/transport/requests/${id}/cancel-mine`, { method: "PATCH" })
      onCancelled(d.request)
    } catch (err) {
      setError(err.message || "Could not cancel")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="mt-3">
      <button onClick={cancel} disabled={busy} className="w-full rounded-xl border border-[#E4E1D8] py-2 text-xs font-bold text-red-600 disabled:opacity-50">
        {busy ? "Cancelling..." : "Cancel request"}
      </button>
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  )
}

export const timeOf = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

export function OtpCard({ label, code, hint }) {
  return (
    <div className="rounded-xl border border-dashed border-[#C28D2E] bg-[#FBF6EC] p-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-bold text-[#8A6416]">
          <ShieldCheck className="h-3.5 w-3.5" /> {label}
        </p>
        <p className="font-mono text-xl font-extrabold tracking-[0.3em] text-[#0F2238]">{code}</p>
      </div>
      <p className="mt-1 text-[11px] text-neutral-600">{hint}</p>
    </div>
  )
}

export function RateTrip({ requestId, reviewed }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(Boolean(reviewed))
  const [error, setError] = useState("")

  const submit = async () => {
    setSaving(true)
    setError("")
    try {
      await apiFetch(`/transport/requests/${requestId}/review`, { method: "POST", body: { rating, comment } })
      setDone(true)
    } catch (err) {
      setError(err.message || "Could not save your review")
    } finally {
      setSaving(false)
    }
  }

  if (done) return <p className="mt-3 text-center text-xs font-bold text-emerald-700">Thanks for rating this trip</p>

  return (
    <div className="mt-3 space-y-2 border-t border-[#E4E1D8] pt-3">
      <p className="text-xs font-bold text-[#0F2238]">How was the transport?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
            <Star className={`h-6 w-6 ${n <= rating ? "fill-[#C28D2E] text-[#C28D2E]" : "text-neutral-300"}`} />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Share a few words (optional)"
            className="w-full resize-none rounded-xl border border-[#E4E1D8] px-3 py-2 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button onClick={submit} disabled={saving} className="w-full rounded-xl bg-[#0B1C33] py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Submit rating"}
          </button>
        </>
      )}
    </div>
  )
}
