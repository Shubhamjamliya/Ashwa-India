import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { CalendarClock, Heart, MapPin, Phone, Play, Send, Share2 } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import useLiveEvents from "@/shared/lib/useLiveEvents"
import { useWishlist } from "../context/WishlistContext"
import PageHeader from "../components/PageHeader"

const SCOPE_LABEL = {
  riding: "Riding",
  racing: "Racing",
  breeding: "Breeding",
  showing: "Showing",
  pleasure: "Pleasure",
  trekking: "Trekking",
  therapy: "Therapy",
  draught: "Draught",
}

const VACCINATION_LABEL = { complete: "Complete", partial: "Partial", none: "None", unknown: "Not known" }

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "")

// Lease listings show their own rate and period; sale listings show the sale price.
export function priceLabel(horse) {
  if (horse.listingType === "lease") {
    return `₹${horse.leaseRate?.toLocaleString("en-IN")} / ${horse.leasePeriod || "month"}`
  }
  return `₹${horse.price?.toLocaleString("en-IN")}`
}
const fmt = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

function Row({ label, children }) {
  if (children === null || children === undefined || children === "") return null
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#E4E1D8] py-2.5 last:border-0">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="text-right text-[13px] font-semibold text-[#0F2238]">{children}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-2 rounded-2xl border border-[#E4E1D8] bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">{title}</p>
      {children}
    </div>
  )
}

// Live conversation with the seller about this horse.
function Conversation({ inquiryId }) {
  const [inquiry, setInquiry] = useState(null)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  const load = () =>
    apiFetch(`/marketplace/inquiries/${inquiryId}`)
      .then((d) => setInquiry(d.inquiry))
      .catch((err) => setError(err.message))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiryId])

  useLiveEvents("user", {
    "inquiry:message": (p) => {
      if (p.inquiryId === inquiryId) load()
    },
  })

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    setError("")
    try {
      await apiFetch(`/marketplace/inquiries/${inquiryId}/messages`, { method: "POST", body: { text: text.trim() } })
      setText("")
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl bg-[#F6F3EC] p-3">
        {(inquiry?.messages || []).map((m, i) => (
          <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] ${m.sender === "user" ? "bg-[#0B1C33] text-white" : "bg-white text-[#0F2238]"}`}>
              <p className="whitespace-pre-line">{m.text}</p>
              <p className={`mt-0.5 text-[10px] ${m.sender === "user" ? "text-white/60" : "text-neutral-400"}`}>{fmt(m.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          maxLength={1000}
          className="h-10 flex-1 rounded-xl border border-[#E4E1D8] px-3 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
        />
        <button type="submit" disabled={sending || !text.trim()} className="flex h-10 items-center gap-1 rounded-xl bg-[#C28D2E] px-4 text-sm font-bold text-white disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Link to="/user/inquiries" className="block text-center text-xs font-bold text-[#C28D2E]">See all your conversations</Link>
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
  const [inquiryId, setInquiryId] = useState(null)
  const [visitOpen, setVisitOpen] = useState(false)
  const [visitAt, setVisitAt] = useState("")
  const [visitNote, setVisitNote] = useState("")
  const [visitSent, setVisitSent] = useState(false)
  const [visitError, setVisitError] = useState("")
  const [shareNote, setShareNote] = useState("")

  useEffect(() => {
    apiFetch(`/marketplace/horses/${id}`)
      .then((data) => setHorse(data.horse))
      .catch((err) => setError(err.message || "Failed to load listing"))
      .finally(() => setLoading(false))
  }, [id])

  const startConversation = async () => {
    if (!message.trim()) return
    setSending(true)
    setError("")
    try {
      const data = await apiFetch("/marketplace/inquiries", { method: "POST", body: { horseId: id, message: message.trim() } })
      setInquiryId(data.inquiry._id)
      setMessage("")
    } catch (err) {
      setError(err.message || "Failed to send inquiry")
    } finally {
      setSending(false)
    }
  }

  const requestVisit = async () => {
    setVisitError("")
    if (!visitAt) return setVisitError("Pick a date and time")
    try {
      await apiFetch("/marketplace/visits", {
        method: "POST",
        body: { horseId: id, preferredAt: new Date(visitAt).toISOString(), message: visitNote.trim() || undefined },
      })
      setVisitSent(true)
      setVisitOpen(false)
    } catch (err) {
      setVisitError(err.message || "Could not send the visit request")
    }
  }

  const share = async () => {
    const url = window.location.href
    const title = `${horse.name || horse.breed} on Ashwa India`
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareNote("Link copied")
        setTimeout(() => setShareNote(""), 2000)
      }
    } catch {
      // The user dismissed the share sheet.
    }
  }

  const headerActions = horse && (
    <div className="flex items-center gap-2">
      <button type="button" onClick={share} aria-label="Share listing" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
        <Share2 className="h-[17px] w-[17px] text-[#0F2238]" />
      </button>
      <button type="button" onClick={() => toggle(horse)} aria-label="Save horse" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E1D8] bg-white">
        <Heart className="h-[18px] w-[18px] text-[#C28D2E]" fill={isSaved(horse._id) ? "#C28D2E" : "transparent"} />
      </button>
    </div>
  )

  if (loading) {
    return (
      <div className="pb-6">
        <PageHeader title="Horse Details" />
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error && !horse) {
    return (
      <div className="pb-6">
        <PageHeader title="Horse Details" />
        <p className="px-8 py-20 text-center text-sm text-destructive">{error}</p>
      </div>
    )
  }

  const scope = (horse.scopeOfWork || []).map((s) => SCOPE_LABEL[s] || cap(s)).join(", ")
  const photos = horse.photos || []
  const videos = (horse.videos || []).filter(Boolean)
  const registration = [horse.registration?.registry, horse.registration?.number].filter(Boolean).join(" · ")
  const isLease = horse.listingType === "lease"

  return (
    <div className="pb-6">
      <PageHeader title="Horse Details" right={headerActions} />
      {shareNote && <p className="px-4 text-center text-xs font-bold text-emerald-700">{shareNote}</p>}

      <div className="space-y-4 px-4">
        <div className="h-[220px] w-full overflow-hidden rounded-2xl bg-[#F1EEE6]">
          {photos[0] && <img src={getMediaUrl(photos[0])} alt={horse.name || horse.breed} className="h-full w-full object-cover" />}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <p className="text-[22px] font-bold text-[#0F2238]">{horse.name || horse.breed}</p>
            <span className="rounded-full bg-[#0B1C33] px-2 py-0.5 text-[10px] font-bold text-white">{isLease ? "FOR LEASE" : "FOR SALE"}</span>
          </div>
          {horse.name && <p className="text-sm text-neutral-500">{horse.breed}</p>}
          <div className="mt-2 flex items-center gap-2">
            <p className="text-lg font-bold text-[#C28D2E]">{priceLabel(horse)}</p>
            {!isLease && horse.priceNegotiable && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Negotiable</span>}
          </div>
        </div>

        <Section title="Horse details">
          <Row label="Breed">{horse.breed}</Row>
          <Row label="Age">{horse.age != null ? `${horse.age} yrs` : ""}</Row>
          <Row label="Gender">{cap(horse.gender)}</Row>
          <Row label="Height">{horse.height != null ? `${horse.height} hh` : ""}</Row>
          <Row label="Color">{horse.color}</Row>
          <Row label="Discipline">{horse.discipline}</Row>
          <Row label="Training level">{cap(horse.trainingLevel)}</Row>
          <Row label="Scope of work">{scope}</Row>
        </Section>

        <Section title="Health information">
          <Row label="Vaccination status">{VACCINATION_LABEL[horse.health?.vaccinationStatus] || ""}</Row>
          <Row label="Health notes">{horse.health?.notes}</Row>
        </Section>

        <Section title="Registration details">
          <Row label="Registry">{registration}</Row>
          {!registration && <p className="text-xs text-neutral-500">Not registered or not provided.</p>}
        </Section>

        {photos.length > 0 && (
          <Section title="Images">
            <div className="grid grid-cols-3 gap-2">
              {photos.map((url, i) => (
                <div key={url + i} className="aspect-square overflow-hidden rounded-xl bg-[#F1EEE6]">
                  <img src={getMediaUrl(url)} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </Section>
        )}

        {videos.length > 0 && (
          <Section title="Videos">
            <div className="space-y-2">
              {videos.map((url, i) => (
                <a key={url + i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-[#F1EEE6] p-3 text-[13px] font-semibold text-[#0F2238]">
                  <Play className="h-4 w-4 text-[#C28D2E]" />
                  <span className="truncate">Watch video {videos.length > 1 ? i + 1 : ""}</span>
                </a>
              ))}
            </div>
          </Section>
        )}

        <Section title="Seller information">
          <p className="text-sm font-bold text-[#0F2238]">{horse.seller?.businessName || horse.seller?.name}</p>
          {horse.seller?.phone && (
            <p className="flex items-center gap-1.5 text-[13px] text-neutral-600">
              <Phone className="h-3.5 w-3.5" />
              {horse.seller.phone}
            </p>
          )}
          {horse.location && (
            <p className="flex items-center gap-1.5 text-[13px] text-neutral-600">
              <MapPin className="h-3.5 w-3.5" />
              {horse.location}
            </p>
          )}
        </Section>

        {horse.description && (
          <Section title="About this horse">
            <p className="text-sm leading-5 text-[#0F2238]">{horse.description}</p>
          </Section>
        )}

        <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <p className="text-[15px] font-bold text-[#0F2238]">Contact seller</p>
          {inquiryId ? (
            <Conversation inquiryId={inquiryId} />
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message to the seller..."
                rows={3}
                className="w-full resize-none rounded-xl border border-[#E4E1D8] px-3 py-2 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
              />
              {error && <p className="text-[13px] text-destructive">{error}</p>}
              <button
                onClick={startConversation}
                disabled={!message.trim() || sending}
                className="w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send message"}
              </button>
            </>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-bold text-[#0F2238]">Visit the horse</p>
            {!visitSent && (
              <button onClick={() => setVisitOpen((v) => !v)} className="flex items-center gap-1 text-xs font-bold text-[#C28D2E]">
                <CalendarClock className="h-4 w-4" /> {visitOpen ? "Close" : "Request visit"}
              </button>
            )}
          </div>
          {visitSent && <p className="text-sm text-emerald-700">Visit request sent. The seller will confirm soon. Track it under your conversations.</p>}
          {visitOpen && !visitSent && (
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={visitAt}
                onChange={(e) => setVisitAt(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E4E1D8] px-3 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
              />
              <textarea
                value={visitNote}
                onChange={(e) => setVisitNote(e.target.value)}
                rows={2}
                placeholder="Anything the seller should know (optional)"
                className="w-full resize-none rounded-xl border border-[#E4E1D8] px-3 py-2 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
              />
              {visitError && <p className="text-xs text-destructive">{visitError}</p>}
              <button onClick={requestVisit} className="w-full rounded-xl bg-[#0B1C33] py-2.5 text-sm font-bold text-white">
                Send visit request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
