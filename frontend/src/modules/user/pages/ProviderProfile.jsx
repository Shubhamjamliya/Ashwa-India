import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Briefcase, CheckCircle2, Mail, MapPin, Phone, Stethoscope } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import BackButton from "../components/BackButton"
import { Stars } from "./ServiceProviders"

const UNIT_LABEL = { visit: "per visit", hour: "per hour", day: "per day", job: "per job" }
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

function Section({ title, children }) {
  return (
    <div className="space-y-2 rounded-2xl border border-[#E4E1D8] bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">{title}</p>
      {children}
    </div>
  )
}

export default function ProviderProfile() {
  const { key, id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState("")
  const [photo, setPhoto] = useState(null)

  useEffect(() => {
    apiFetch(`/services/providers/${id}`)
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load provider"))
      .finally(() => setLoading(false))
  }, [id])

  const send = async () => {
    setSending(true)
    setSendError("")
    try {
      await apiFetch("/services/requests", {
        method: "POST",
        body: { providerId: id, serviceType: key, message: message.trim() || undefined },
      })
      setSent(true)
      setOpen(false)
    } catch (err) {
      setSendError(err.message || "Could not send the request")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
      </div>
    )
  }
  if (error || !data) return <p className="px-8 py-24 text-center text-sm text-destructive">{error || "Provider not found"}</p>

  const p = data.provider
  const reviews = data.reviews || []
  const offered = (p.pricing || []).filter((x) => p.serviceTypes.includes(x.serviceKey))
  const thisPrice = offered.find((x) => x.serviceKey === key)

  return (
    <div className="pb-28">
      <div className="sticky top-0 z-30 flex items-center gap-2 bg-[#0B1C33] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <BackButton variant="dark" />
        <h1 className="text-[17px] font-bold text-white">Provider profile</h1>
      </div>

      <div className="space-y-4 px-4 pt-4">
        <div className="rounded-2xl bg-[#0B1C33] p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#C28D2E] bg-[#132B4A]">
              <Stethoscope className="h-7 w-7 text-[#C28D2E]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold text-white">{p.businessName || "Provider"}</p>
              <div className="mt-1 flex items-center gap-2">
                <Stars value={p.rating.average} />
                <span className="text-xs text-[#A9B8CC]">{p.rating.count ? `${p.rating.average.toFixed(1)} · ${p.rating.count} reviews` : "No reviews yet"}</span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-[#A9B8CC]">
                <Briefcase className="h-3.5 w-3.5" /> {p.experienceYears} {p.experienceYears === 1 ? "year" : "years"} experience
              </p>
            </div>
          </div>
          {p.description && <p className="mt-3 text-[13px] leading-5 text-[#E7EDF5]">{p.description}</p>}
        </div>

        {(p.serviceTypes || []).length > 0 && (
          <Section title="Services">
            <div className="flex flex-wrap gap-1.5">
              {p.serviceTypes.map((s) => (
                <span key={s} className="rounded-full bg-[#F6E9C9] px-2.5 py-1 text-[11px] font-bold capitalize text-[#8A6416]">
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {p.gallery?.length > 0 && (
          <Section title="Gallery">
            <div className="grid grid-cols-3 gap-2">
              {p.gallery.map((url, i) => (
                <button key={url + i} onClick={() => setPhoto(url)} className="aspect-square overflow-hidden rounded-xl bg-[#F1EEE6]">
                  <img src={getMediaUrl(url)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </Section>
        )}

        {offered.length > 0 && (
          <Section title="Pricing">
            <div className="divide-y divide-[#E4E1D8]">
              {offered.map((x) => (
                <div key={x.serviceKey} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold capitalize text-[#0F2238]">{x.serviceKey}</p>
                    {x.note && <p className="text-[11px] text-neutral-500">{x.note}</p>}
                  </div>
                  <p className="shrink-0 text-sm font-extrabold text-[#C28D2E]">
                    ₹{x.amount.toLocaleString("en-IN")} <span className="text-[11px] font-semibold text-neutral-500">{UNIT_LABEL[x.unit]}</span>
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {p.certifications && (
          <Section title="Credentials">
            <p className="text-[13px] text-[#0F2238]">{p.certifications}</p>
          </Section>
        )}

        {(p.serviceZones || []).length > 0 && (
          <Section title="Service area">
            <div className="flex flex-wrap gap-1.5">
              {p.serviceZones.map((z) => (
                <span key={z.id} className="flex items-center gap-1 rounded-full bg-[#E1ECFC] px-2.5 py-1 text-[11px] font-bold text-[#2563EB]">
                  <MapPin className="h-3 w-3" /> {z.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        <Section title="Contact details">
          {p.location && (
            <p className="flex items-center gap-2 text-[13px] text-[#0F2238]">
              <MapPin className="h-4 w-4 text-neutral-500" /> {p.location}
            </p>
          )}
          {p.phone && (
            <a href={`tel:${p.phone}`} className="flex items-center gap-2 text-[13px] font-bold text-[#0F2238]">
              <Phone className="h-4 w-4 text-neutral-500" /> {p.phone}
            </a>
          )}
          {p.email && (
            <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-[13px] text-[#0F2238]">
              <Mail className="h-4 w-4 text-neutral-500" /> {p.email}
            </a>
          )}
        </Section>

        <Section title={`Reviews & ratings${reviews.length ? ` (${reviews.length})` : ""}`}>
          {reviews.length === 0 ? (
            <p className="text-xs text-neutral-500">No reviews yet. Reviews appear after a completed service.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-[#E4E1D8] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-bold text-[#0F2238]">{r.userName}</p>
                    <Stars value={r.rating} />
                  </div>
                  {r.comment && <p className="mt-1 text-[12px] text-neutral-600">{r.comment}</p>}
                  <p className="mt-1 text-[10px] text-neutral-400">{fmtDate(r.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E4E1D8] bg-white p-4">
        {sent ? (
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Request sent
            </p>
            <Link to="/user/bookings" className="text-xs font-bold text-[#C28D2E]">
              View bookings
            </Link>
          </div>
        ) : open ? (
          <div className="space-y-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Describe what you need (optional)"
              className="w-full resize-none rounded-xl border border-[#E4E1D8] px-3 py-2 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
            />
            {sendError && <p className="text-xs text-destructive">{sendError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl bg-[#F1EEE6] py-3 text-sm font-bold text-[#0F2238]">
                Cancel
              </button>
              <button onClick={send} disabled={sending} className="flex-1 rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50">
                {sending ? "Sending..." : "Send request"}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setOpen(true)} className="w-full rounded-xl bg-[#C28D2E] py-3.5 text-sm font-bold text-white">
            Book this provider{thisPrice ? ` · ₹${thisPrice.amount.toLocaleString("en-IN")} ${UNIT_LABEL[thisPrice.unit]}` : ""}
          </button>
        )}
      </div>

      {photo && (
        <div onClick={() => setPhoto(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <img src={getMediaUrl(photo)} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  )
}
