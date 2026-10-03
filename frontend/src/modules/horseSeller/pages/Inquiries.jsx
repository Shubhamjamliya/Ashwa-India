import { useCallback, useEffect, useState } from "react"
import { CalendarClock, Check, Loader2, MessageSquare, Send, X } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import useLiveEvents from "@/shared/lib/useLiveEvents"

const fmt = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

const visitBadge = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
  cancelled: "bg-neutral-200 text-neutral-700",
}

function ConversationList({ inquiries, activeId, onOpen }) {
  if (inquiries.length === 0) {
    return <p className="p-6 text-center text-sm text-neutral-500">No conversations yet. Buyers who contact you about a horse appear here.</p>
  }
  return (
    <div className="divide-y divide-neutral-100">
      {inquiries.map((inq) => (
        <button
          key={inq._id}
          onClick={() => onOpen(inq._id)}
          className={`flex w-full items-start gap-3 p-4 text-left hover:bg-neutral-50 ${activeId === inq._id ? "bg-amber-50" : ""}`}
        >
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
            {inq.horse?.photos?.[0] && <img src={getMediaUrl(inq.horse.photos[0])} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-neutral-900">{inq.buyer?.name || inq.buyer?.phone || "Buyer"}</p>
              {inq.status === "open" && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">New</span>}
            </div>
            <p className="truncate text-xs text-neutral-500">{inq.horse?.name || inq.horse?.breed}</p>
            <p className="mt-0.5 text-[11px] text-neutral-400">{fmt(inq.lastMessageAt || inq.createdAt)}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

function Thread({ inquiryId, onChanged }) {
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

  if (!inquiry) return <div className="flex h-full items-center justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-amber-600" /></div>

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200 p-4">
        <p className="text-sm font-bold text-neutral-900">{inquiry.buyer?.name || inquiry.buyer?.phone}</p>
        <p className="text-xs text-neutral-500">About: {inquiry.horse?.name || inquiry.horse?.breed} · ₹{inquiry.horse?.price?.toLocaleString("en-IN")}</p>
        {inquiry.buyer?.phone && <p className="text-xs text-neutral-500">{inquiry.buyer.phone}</p>}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto bg-neutral-50 p-4">
        {(inquiry.messages || []).map((m, i) => (
          <div key={i} className={`flex ${m.sender === "seller" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${m.sender === "seller" ? "bg-neutral-900 text-white" : "bg-white text-neutral-800 shadow-sm"}`}>
              <p className="whitespace-pre-line">{m.text}</p>
              <p className={`mt-1 text-[10px] ${m.sender === "seller" ? "text-white/60" : "text-neutral-400"}`}>{fmt(m.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-neutral-200 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reply to the buyer..."
          maxLength={1000}
          className="h-10 flex-1 rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:border-amber-500"
        />
        <button type="submit" disabled={sending || !text.trim()} className="flex h-10 items-center gap-1.5 rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-40">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send
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
        <div className="grid overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm lg:grid-cols-[320px_1fr]" style={{ minHeight: 480 }}>
          <div className="max-h-[70vh] overflow-y-auto border-r border-neutral-200">
            <ConversationList inquiries={inquiries} activeId={activeId} onOpen={setActiveId} />
          </div>
          <div className="min-h-[400px]">
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
