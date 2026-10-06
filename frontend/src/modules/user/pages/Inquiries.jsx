import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarClock, CheckCheck, MessageSquare, Phone, Send } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import useLiveEvents from "@/shared/lib/useLiveEvents"
import OfferPanel from "@/shared/inquiry/OfferPanel"
import BackButton from "../components/BackButton"

const fmt = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
const fmtTime = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

const visitStyle = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
  cancelled: "bg-neutral-200 text-neutral-700",
}

// "Today", "Yesterday", or a full date, used as the separator between days in the chat.
function dayLabel(d) {
  const date = new Date(d)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function Thread({ id, onBack }) {
  const [inquiry, setInquiry] = useState(null)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const bottomRef = useRef(null)

  const load = () =>
    apiFetch(`/marketplace/inquiries/${id}`)
      .then((d) => setInquiry(d.inquiry))
      .catch((err) => setError(err.message))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useLiveEvents("user", {
    "inquiry:message": (p) => {
      if (p.inquiryId === id) load()
    },
  })

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [inquiry?.messages?.length])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    setError("")
    try {
      await apiFetch(`/marketplace/inquiries/${id}/messages`, { method: "POST", body: { text: text.trim() } })
      setText("")
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (!inquiry) return <div className="flex justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /></div>

  const seller = inquiry.seller?.businessName || inquiry.seller?.name || "Seller"
  const sellerPhone = inquiry.seller?.phone
  const messages = inquiry.messages || []

  // The day label is shown only where the date changes between messages.
  let lastDay = ""

  return (
    <div className="flex h-screen flex-col bg-[#ECE5D8]">
      {/* Header: back arrow, who you are talking to, and call */}
      <div className="flex items-center gap-3 bg-[#0B1C33] px-3 py-3 text-white shadow-sm">
        <button onClick={onBack} aria-label="Back to conversations" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C28D2E] text-sm font-bold">
          {seller.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight">{seller}</p>
          <p className="truncate text-[11px] text-[#A9B8CC]">About: {inquiry.horse?.name || inquiry.horse?.breed}</p>
        </div>
        {sellerPhone && (
          <a href={`tel:${sellerPhone}`} aria-label="Call seller" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600">
            <Phone className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="border-b border-[#E4E1D8] bg-white px-3 py-2">
        <OfferPanel inquiry={inquiry} role="user" onChanged={load} />
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {messages.map((m, i) => {
          const day = dayLabel(m.createdAt)
          const showDay = day !== lastDay
          lastDay = day
          const mine = m.sender === "user"
          const isOffer = m.kind === "offer"
          const isDeal = m.kind === "deal"
          return (
            <div key={i}>
              {showDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-white/80 px-3 py-0.5 text-[11px] font-semibold text-neutral-600 shadow-sm">{day}</span>
                </div>
              )}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-[14px] shadow-sm ${mine ? "rounded-br-md bg-[#DCF4E5] text-[#0F2238]" : "rounded-bl-md bg-white text-[#0F2238]"} ${isDeal ? "ring-1 ring-emerald-400" : ""}`}
                >
                  {isOffer && <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-[#8A6416]">Price offer</p>}
                  {isDeal && (
                    <p className="mb-0.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                      <CheckCheck className="h-3.5 w-3.5" /> Deal
                    </p>
                  )}
                  <p className="whitespace-pre-line break-words">{m.text}</p>
                  <p className="mt-0.5 text-right text-[10px] text-neutral-500">{fmtTime(m.createdAt)}</p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={send} className="flex items-center gap-2 bg-[#F6F3EC] px-3 py-2.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message"
          maxLength={1000}
          className="h-11 flex-1 rounded-full border border-[#E4E1D8] bg-white px-4 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0B1C33] text-white disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      {error && <p className="bg-[#F6F3EC] px-4 pb-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}

export default function Inquiries() {
  const [tab, setTab] = useState("conversations")
  const [inquiries, setInquiries] = useState([])
  const [visits, setVisits] = useState([])
  // An open conversation is its own route (/user/inquiries/:id), so the layout can hide the bottom bar there.
  const { id: openId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const refreshLists = () =>
    Promise.all([apiFetch("/marketplace/inquiries/mine"), apiFetch("/marketplace/visits/mine")])
      .then(([i, v]) => {
        setInquiries(i.inquiries || [])
        setVisits(v.visits || [])
      })
      .catch(() => {})

  useLiveEvents("user", {
    "visit:update": refreshLists,
    "inquiry:message": refreshLists,
  })

  useEffect(() => {
    refreshLists().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (openId) return <Thread id={openId} onBack={() => navigate("/user/inquiries")} />

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 p-4">
        <BackButton />
        <h1 className="text-[17px] font-bold text-[#0F2238]">Horse enquiries</h1>
      </div>

      <div className="flex gap-1.5 px-4 pb-3">
        {[
          { key: "conversations", label: "Conversations", icon: MessageSquare },
          { key: "visits", label: "Visit requests", icon: CalendarClock },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold ${tab === t.key ? "bg-[#0B1C33] text-white" : "border border-[#E4E1D8] bg-white text-neutral-600"}`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" /></div>
      ) : tab === "conversations" ? (
        inquiries.length === 0 ? (
          <p className="px-8 py-16 text-center text-sm text-neutral-500">No conversations yet. Message a seller from a horse listing.</p>
        ) : (
          <div className="space-y-2.5 px-4">
            {inquiries.map((inq) => (
              <button key={inq._id} onClick={() => navigate(`/user/inquiries/${inq._id}`)} className="flex w-full items-center gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-3 text-left">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#F1EEE6]">
                  {inq.horse?.photos?.[0] && <img src={getMediaUrl(inq.horse.photos[0])} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#0F2238]">{inq.horse?.name || inq.horse?.breed}</p>
                  <p className="truncate text-xs text-neutral-500">{inq.seller?.businessName || inq.seller?.name}</p>
                  <p className="text-[11px] text-neutral-400">{fmt(inq.lastMessageAt || inq.createdAt)}</p>
                </div>
                {inq.status === "replied" && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Replied</span>}
              </button>
            ))}
          </div>
        )
      ) : visits.length === 0 ? (
        <p className="px-8 py-16 text-center text-sm text-neutral-500">No visit requests yet.</p>
      ) : (
        <div className="space-y-2.5 px-4">
          {visits.map((v) => (
            <div key={v._id} className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-[#0F2238]">{v.horse?.name || v.horse?.breed}</p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${visitStyle[v.status]}`}>{v.status}</span>
              </div>
              <p className="mt-1 text-xs text-neutral-600">Preferred: {fmt(v.preferredAt)}</p>
              <p className="text-xs text-neutral-500">{v.seller?.businessName || v.seller?.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
