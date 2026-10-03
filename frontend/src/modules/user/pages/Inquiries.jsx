import { useEffect, useState } from "react"
import { CalendarClock, MessageSquare, Send } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import useLiveEvents from "@/shared/lib/useLiveEvents"
import BackButton from "../components/BackButton"

const fmt = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

const visitStyle = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
  cancelled: "bg-neutral-200 text-neutral-700",
}

function Thread({ id, onBack }) {
  const [inquiry, setInquiry] = useState(null)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

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

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex items-center gap-3 border-b border-[#E4E1D8] bg-white p-4">
        <button onClick={onBack} className="text-xs font-bold text-[#C28D2E]">Back</button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#0F2238]">{inquiry.horse?.name || inquiry.horse?.breed}</p>
          <p className="truncate text-xs text-neutral-500">Seller: {inquiry.seller?.businessName || inquiry.seller?.name}</p>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto bg-[#F6F3EC] p-4">
        {(inquiry.messages || []).map((m, i) => (
          <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] ${m.sender === "user" ? "bg-[#0B1C33] text-white" : "bg-white text-[#0F2238]"}`}>
              <p className="whitespace-pre-line">{m.text}</p>
              <p className={`mt-0.5 text-[10px] ${m.sender === "user" ? "text-white/60" : "text-neutral-400"}`}>{fmt(m.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-[#E4E1D8] bg-white p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          maxLength={1000}
          className="h-10 flex-1 rounded-xl border border-[#E4E1D8] px-3 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
        />
        <button type="submit" disabled={sending || !text.trim()} className="flex h-10 items-center rounded-xl bg-[#C28D2E] px-4 text-sm font-bold text-white disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
      {error && <p className="px-4 pb-3 text-xs text-destructive">{error}</p>}
    </div>
  )
}

export default function Inquiries() {
  const [tab, setTab] = useState("conversations")
  const [inquiries, setInquiries] = useState([])
  const [visits, setVisits] = useState([])
  const [openId, setOpenId] = useState(null)
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
    Promise.all([apiFetch("/marketplace/inquiries/mine"), apiFetch("/marketplace/visits/mine")])
      .then(([i, v]) => {
        setInquiries(i.inquiries || [])
        setVisits(v.visits || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (openId) return <Thread id={openId} onBack={() => setOpenId(null)} />

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
              <button key={inq._id} onClick={() => setOpenId(inq._id)} className="flex w-full items-center gap-3 rounded-2xl border border-[#E4E1D8] bg-white p-3 text-left">
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
