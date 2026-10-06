import { useCallback, useEffect, useRef, useState } from "react"
import { CalendarClock, Check, CheckCheck, Loader2, MessageSquare, Phone, Send, X } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import OfferPanel from "@/shared/inquiry/OfferPanel"
import { getMediaUrl } from "@/shared/lib/media"
import useLiveEvents from "@/shared/lib/useLiveEvents"

const fmt = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
const fmtTime = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

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

const visitBadge = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
  cancelled: "bg-neutral-200 text-neutral-700",
}

// Each buyer gets a stable colour from their id, so the same buyer always looks the same in the list.
const BUYER_COLORS = [
  { bar: "bg-rose-500", avatar: "bg-rose-100 text-rose-700", name: "text-rose-700" },
  { bar: "bg-sky-500", avatar: "bg-sky-100 text-sky-700", name: "text-sky-700" },
  { bar: "bg-emerald-500", avatar: "bg-emerald-100 text-emerald-700", name: "text-emerald-700" },
  { bar: "bg-violet-500", avatar: "bg-violet-100 text-violet-700", name: "text-violet-700" },
  { bar: "bg-amber-500", avatar: "bg-amber-100 text-amber-700", name: "text-amber-700" },
  { bar: "bg-teal-500", avatar: "bg-teal-100 text-teal-700", name: "text-teal-700" },
]

function buyerColor(id) {
  const str = String(id || "")
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  return BUYER_COLORS[hash % BUYER_COLORS.length]
}

function ConversationList({ inquiries, activeId, onOpen }) {
  if (inquiries.length === 0) {
    return <p className="p-6 text-center text-sm text-neutral-500">No conversations yet. Buyers who contact you about a horse appear here.</p>
  }
  return (
    <div className="divide-y divide-neutral-100">
      {inquiries.map((inq) => {
        const color = buyerColor(inq.buyer?._id || inq.buyer)
        const label = inq.buyer?.name || inq.buyer?.phone || "Buyer"
        return (
          <button
            key={inq._id}
            onClick={() => onOpen(inq._id)}
            className={`relative flex w-full items-start gap-3 p-4 pl-5 text-left hover:bg-neutral-50 ${activeId === inq._id ? "bg-amber-50" : ""}`}
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${color.bar}`} />
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${color.avatar}`}>
              {label.trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={`truncate text-sm font-bold ${color.name}`}>{label}</p>
                {inq.status === "open" && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">New</span>}
              </div>
              <p className="truncate text-xs text-neutral-500">{inq.horse?.name || inq.horse?.breed}</p>
              <p className="mt-0.5 text-[11px] text-neutral-400">{fmt(inq.lastMessageAt || inq.createdAt)}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function Thread({ inquiryId, onChanged }) {
  const bottomRef = useRef(null)
  const [inquiry, setInquiry] = useState(null)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(() => {
    apiFetch(`/marketplace/inquiries/${inquiryId}`)
      .then((d) => setInquiry(d.inquiry))
      .catch((err) => setError(err.message))
  }, [inquiryId])

  useEffect(() => {
    setInquiry(null)
    load()
  }, [load])

  useLiveEvents("horse-seller", {
    "inquiry:message": (p) => {
      if (p.inquiryId === inquiryId) load()
      onChanged?.()
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
      onChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [inquiry?.messages?.length])

  if (!inquiry && error) return <div className="p-6 text-sm text-destructive">Could not open this conversation: {error}</div>
  if (!inquiry) return <div className="flex h-full items-center justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-amber-600" /></div>

  const buyer = inquiry.buyer?.name || inquiry.buyer?.phone || "Buyer"
  const color = buyerColor(inquiry.buyer?._id || inquiry.buyer)
  const messages = inquiry.messages || []
  // The day label is shown only where the date changes between messages.
  let lastDay = ""

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#ECE5D8]">
      {/* Header: who you are talking to, the horse, and call */}
      <div className="flex items-center gap-3 bg-[#0B1C33] px-4 py-3 text-white">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${color.avatar}`}>
          {buyer.trim().charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight">{buyer}</p>
          <p className="truncate text-[11px] text-[#A9B8CC]">
            About: {inquiry.horse?.name || inquiry.horse?.breed} · ₹{inquiry.horse?.price?.toLocaleString("en-IN")}
          </p>
        </div>
        {inquiry.buyer?.phone && (
          <a href={`tel:${inquiry.buyer.phone}`} aria-label="Call buyer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600">
            <Phone className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="border-b border-neutral-200 bg-white px-3 py-2">
        <OfferPanel inquiry={inquiry} role="horse-seller" onChanged={() => { load(); onChanged?.() }} />
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => {
          const day = dayLabel(m.createdAt)
          const showDay = day !== lastDay
          lastDay = day
          const mine = m.sender === "seller"
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
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "rounded-br-md bg-[#DCF4E5] text-neutral-900" : "rounded-bl-md bg-white text-neutral-800"} ${isDeal ? "ring-1 ring-emerald-400" : ""}`}
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
      <form onSubmit={send} className="flex items-center gap-2 bg-neutral-50 px-3 py-2.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reply to the buyer"
          maxLength={1000}
          className="h-11 flex-1 rounded-full border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Send reply"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white disabled:opacity-40"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
      {error && <p className="px-4 pb-3 text-xs text-destructive">{error}</p>}
    </div>
  )
}

function VisitList({ visits, onRespond, busyId }) {
  if (visits.length === 0) {
    return <p className="p-6 text-center text-sm text-neutral-500">No visit requests yet.</p>
  }
  return (
    <div className="space-y-3 p-4">
      {visits.map((v) => (
        <div key={v._id} className="rounded-xl border border-neutral-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">{v.buyer?.name || v.buyer?.phone}</p>
              <p className="text-xs text-neutral-500">{v.horse?.name || v.horse?.breed}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${visitBadge[v.status]}`}>{v.status}</span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-700">
            <CalendarClock className="h-3.5 w-3.5" /> Preferred: {fmt(v.preferredAt)}
          </p>
          {v.message && <p className="mt-2 rounded-lg bg-neutral-50 p-2 text-xs text-neutral-600">{v.message}</p>}
          {v.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <button disabled={busyId === v._id} onClick={() => onRespond(v._id, "accept")} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white disabled:opacity-50">
                <Check className="h-3.5 w-3.5" /> Accept
              </button>
              <button disabled={busyId === v._id} onClick={() => onRespond(v._id, "decline")} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-300 py-2 text-xs font-semibold text-neutral-700 disabled:opacity-50">
                <X className="h-3.5 w-3.5" /> Decline
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Inquiries() {
  const [tab, setTab] = useState("conversations")
  const [inquiries, setInquiries] = useState([])
  const [visits, setVisits] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState("")

  const loadAll = useCallback(() => {
    Promise.all([apiFetch("/marketplace/inquiries"), apiFetch("/marketplace/visits")])
      .then(([i, v]) => {
        setInquiries(i.inquiries || [])
        setVisits(v.visits || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useLiveEvents("horse-seller", {
    "inquiry:new": loadAll,
    "inquiry:message": loadAll,
    "visit:new": loadAll,
  })

  const respond = async (id, action) => {
    setBusyId(id)
    setError("")
    try {
      const data = await apiFetch(`/marketplace/visits/${id}`, { method: "PATCH", body: { action } })
      setVisits((prev) => prev.map((v) => (v._id === id ? { ...v, ...data.visit } : v)))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const tabs = [
    { key: "conversations", label: "Conversations", icon: MessageSquare, count: inquiries.filter((i) => i.status === "open").length },
    { key: "visits", label: "Visit requests", icon: CalendarClock, count: visits.filter((v) => v.status === "pending").length },
  ]

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Inquiries</h1>
        <p className="mt-1 text-sm text-neutral-500">Reply to buyers about your horses and answer visit requests.</p>
        <div className="mt-4 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${tab === t.key ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count > 0 && <span className="rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">{t.count}</span>}
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
      ) : tab === "visits" ? (
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <VisitList visits={visits} onRespond={respond} busyId={busyId} />
        </div>
      ) : (
        <div className="grid overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm lg:grid-cols-[320px_1fr]" style={{ height: "max(620px, calc(100vh - 170px))" }}>
          <div className="overflow-y-auto border-r border-neutral-200">
            <ConversationList inquiries={inquiries} activeId={activeId} onOpen={setActiveId} />
          </div>
          <div className="flex min-h-0 flex-col">
            {activeId ? (
              <Thread key={activeId} inquiryId={activeId} onChanged={loadAll} />
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-sm text-neutral-500">Select a conversation to read and reply.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
