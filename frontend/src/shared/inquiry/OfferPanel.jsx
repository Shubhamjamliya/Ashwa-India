import { useState } from "react"
import { CheckCircle2, Phone, XCircle } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`

// Price talk for one horse enquiry. Shared by the buyer and seller threads.
// No payment happens here. The parties agree a price, then call each other.
// role is 'user' (buyer) or 'horse-seller' (seller). The other party's phone is the call button.
export default function OfferPanel({ inquiry, role, onChanged }) {
  const [amount, setAmount] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const mine = role === "user" ? "user" : "seller"
  const quote = inquiry.quote
  const pending = quote?.status === "pending"
  const canAnswer = pending && quote.by !== mine
  const otherPhone = role === "user" ? inquiry.seller?.phone : inquiry.buyer?.phone
  const otherName = role === "user" ? inquiry.seller?.businessName || inquiry.seller?.name : inquiry.buyer?.name || inquiry.buyer?.phone

  const run = async (fn) => {
    setBusy(true)
    setError("")
    try {
      await fn()
      onChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const sendOffer = (e) => {
    e.preventDefault()
    run(async () => {
      await apiFetch(`/marketplace/inquiries/${inquiry._id}/messages`, { method: "POST", body: { text: "", offerAmount: Number(amount) } })
      setAmount("")
    })
  }

  const answer = (action) => run(() => apiFetch(`/marketplace/inquiries/${inquiry._id}/quote`, { method: "PATCH", body: { action } }))

  return (
    <div className="space-y-3 rounded-xl border border-[#E4E1D8] bg-[#FBF8F1] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8A6416]">Price talk</p>
          {inquiry.agreedAmount ? (
            <p className="flex items-center gap-1 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Agreed at {money(inquiry.agreedAmount)}
            </p>
          ) : pending ? (
            <p className="text-sm font-bold text-[#0F2238]">
              Offer {money(quote.amount)} · {quote.by === mine ? "from you, waiting for reply" : "from them"}
            </p>
          ) : quote?.status === "declined" ? (
            <p className="text-sm font-semibold text-neutral-600">Last offer of {money(quote.amount)} was declined</p>
          ) : (
            <p className="text-sm text-neutral-600">No offer yet. Make one below.</p>
          )}
        </div>
        {otherPhone && (
          <a href={`tel:${otherPhone}`} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">
            <Phone className="h-3.5 w-3.5" /> Call {otherName ? otherName.split(" ")[0] : ""}
          </a>
        )}
      </div>

      {canAnswer && (
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => answer("accept")} className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-[#0B1C33] text-xs font-bold text-white disabled:opacity-50">
            <CheckCircle2 className="h-3.5 w-3.5" /> Accept {money(quote.amount)}
          </button>
          <button disabled={busy} onClick={() => answer("decline")} className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-[#E4E1D8] bg-white text-xs font-bold text-[#0F2238] disabled:opacity-50">
            <XCircle className="h-3.5 w-3.5" /> Decline
          </button>
        </div>
      )}

      {!inquiry.agreedAmount && (
        <form onSubmit={sendOffer} className="flex gap-2">
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            placeholder={pending ? "Counter-offer (₹)" : "Your offer (₹)"}
            className="h-9 flex-1 rounded-lg border border-[#E4E1D8] bg-white px-3 text-sm outline-none focus:border-[#C28D2E]"
          />
          <button type="submit" disabled={busy || !amount} className="h-9 rounded-lg bg-[#C28D2E] px-4 text-xs font-bold text-white disabled:opacity-50">
            Send offer
          </button>
        </form>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
