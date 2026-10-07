import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Bookmark,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Dna,
  Heart,
  LayoutGrid,
  MapPin,
  Medal,
  MessageCircle,
  Palette,
  Phone,
  Play,
  Ruler,
  Share2,
  ShieldCheck,
  VenetianMask,
} from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import { getMediaUrl } from "@/shared/lib/media"
import { useBranding } from "@/shared/context/BrandingContext"
import DateTimePicker from "@/shared/components/DateTimePicker"
import { useWishlist } from "../context/WishlistContext"

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
// One cell of the icon spec grid (type, age, height, breed, ...).
function Spec({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="min-w-0 space-y-1">
      <Icon className="h-[18px] w-[18px] text-[#0B1C33]" />
      <p className="truncate text-[9px] font-bold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="truncate text-[13px] font-bold text-[#0F2238]">{value}</p>
    </div>
  )
}

function Row({ label, children }) {
  if (children === null || children === undefined || children === "") return null
  return (
    <div className="flex items-center justify-between gap-4 py-1 text-[12.5px]">
      <span className="text-neutral-500">{label}</span>
      <span className="font-semibold text-[#0F2238]">{children}</span>
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

export default function HorseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { companyName, logoUrl } = useBranding()
  const { isSaved, toggle } = useWishlist()
  const [horse, setHorse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [enquiring, setEnquiring] = useState(false)
  const [visitOpen, setVisitOpen] = useState(false)
  const [visitAt, setVisitAt] = useState("")
  const [visitNote, setVisitNote] = useState("")
  const [visitSent, setVisitSent] = useState(false)
  const [visitError, setVisitError] = useState("")
  const [shareNote, setShareNote] = useState("")
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    apiFetch(`/marketplace/horses/${id}`)
      .then((data) => setHorse(data.horse))
      .catch((err) => setError(err.message || "Failed to load listing"))
      .finally(() => setLoading(false))
  }, [id])

  // Opens the full chat thread (/user/inquiries/:id) for this horse — reuses an existing
  // conversation with the seller if there is one, otherwise starts a new one first.
  const openChat = async () => {
    if (enquiring) return
    setEnquiring(true)
    setError("")
    try {
      const mine = await apiFetch("/marketplace/inquiries/mine")
      const existing = (mine.inquiries || []).find((inq) => String(inq.horse?._id) === String(id))
      if (existing) {
        navigate(`/user/inquiries/${existing._id}`)
        return
      }
      const data = await apiFetch("/marketplace/inquiries", {
        method: "POST",
        body: { horseId: id, message: `Hi, I'm interested in ${horse.name || horse.breed}. Could you share more details?` },
      })
      navigate(`/user/inquiries/${data.inquiry._id}`)
    } catch (err) {
      setError(err.message || "Could not start the conversation")
    } finally {
      setEnquiring(false)
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
    const title = `${horse.name || horse.breed} on ${companyName}`
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F1]">
        <div className="bg-[#0B1C33] p-4">
          <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C28D2E] border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error && !horse) {
    return (
      <div className="min-h-screen bg-[#FAF7F1]">
        <div className="bg-[#0B1C33] p-4">
          <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
        </div>
        <p className="px-8 py-20 text-center text-sm text-destructive">{error}</p>
      </div>
    )
  }

  const scope = (horse.scopeOfWork || []).map((s) => SCOPE_LABEL[s] || cap(s))
  const photos = horse.photos || []
  const videos = (horse.videos || []).filter(Boolean)
  const registration = [horse.registration?.registry, horse.registration?.number].filter(Boolean).join(" · ")
  const isLease = horse.listingType === "lease"
  const shortId = horse._id ? horse._id.slice(-6).toUpperCase() : ""
  const saved = isSaved(horse._id)
  const THUMB_LIMIT = 4

  return (
    <div className="min-h-screen bg-[#FAF7F1] pb-28">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center gap-2 bg-[#0B1C33] px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          {logoUrl && <img src={logoUrl} alt={companyName} className="h-7 w-7 shrink-0 object-contain" />}
          <div className="min-w-0 text-center">
            <p className="truncate text-[15px] font-extrabold tracking-wide text-[#C28D2E]">{(companyName || "Ashwa India").toUpperCase()}</p>
            <p className="truncate text-[7px] font-semibold uppercase tracking-wider text-white/50">India&apos;s Premier Equine Marketplace</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex flex-col items-center gap-0.5 text-white/80">
            <ShieldCheck className="h-[18px] w-[18px]" />
            <span className="text-[8px] font-semibold">Verified</span>
          </div>
          <button type="button" onClick={() => toggle(horse)} aria-label="Save horse" className="flex flex-col items-center gap-0.5 text-white/80">
            <Heart className="h-[18px] w-[18px]" fill={saved ? "#C28D2E" : "transparent"} color={saved ? "#C28D2E" : "currentColor"} />
            <span className={`text-[8px] font-semibold ${saved ? "text-[#C28D2E]" : ""}`}>Favourite</span>
          </button>
          <button type="button" onClick={share} aria-label="Share listing" className="flex flex-col items-center gap-0.5 text-white/80">
            <Share2 className="h-[18px] w-[18px]" />
            <span className="text-[8px] font-semibold">Share</span>
          </button>
        </div>
      </div>
      {shareNote && <p className="bg-[#0B1C33] pb-2 text-center text-xs font-bold text-emerald-300">{shareNote}</p>}

      {/* Gallery */}
      <div className="relative h-[280px] w-full overflow-hidden bg-[#F1EEE6]">
        {photos[activeImg] ? (
          <img src={getMediaUrl(photos[activeImg])} alt={horse.name || horse.breed} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">No photo available</div>
        )}

        {horse.status === "listed" && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#0B1C33] px-2.5 py-1 text-[10px] font-bold text-white">
            <ShieldCheck className="h-3 w-3 text-[#C28D2E]" /> VERIFIED HORSE
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-[#0B1C33]/90 px-2.5 py-1 text-[10px] font-bold text-white">
          {isLease ? "FOR LEASE" : "FOR SALE"}
        </span>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => setActiveImg((i) => (i - 1 + photos.length) % photos.length)}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => setActiveImg((i) => (i + 1) % photos.length)}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
              {activeImg + 1} / {photos.length}
            </span>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {photos.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === activeImg ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto bg-white px-4 py-3">
          {photos.slice(0, THUMB_LIMIT).map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setActiveImg(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === activeImg ? "border-[#C28D2E]" : "border-transparent"}`}
            >
              <img src={getMediaUrl(url)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          {photos.length > THUMB_LIMIT && (
            <button
              type="button"
              onClick={() => setActiveImg(THUMB_LIMIT)}
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-[#0B1C33] text-white"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="text-[8px] font-bold leading-tight">VIEW ALL</span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-4 px-4 pt-4">
        {/* Horse ID row */}
        <div className="flex items-start justify-between border-b border-[#E4E1D8] pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Horse ID</p>
            <p className="text-xl font-extrabold tracking-wide text-[#0F2238]">{shortId ? `AI-${shortId}` : "—"}</p>
          </div>
          {saved && (
            <span className="flex items-center gap-1 text-[12px] font-bold text-[#C28D2E]">
              <Bookmark className="h-3.5 w-3.5" fill="#C28D2E" /> Shortlisted
            </span>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <p className="text-[20px] font-bold leading-tight text-[#0F2238]">{horse.name || horse.breed}</p>
          {horse.name && <p className="text-sm text-neutral-500">{horse.breed}</p>}
          {horse.location && (
            <p className="flex items-center gap-1 text-[13px] text-neutral-500">
              <MapPin className="h-3.5 w-3.5" /> {horse.location}
            </p>
          )}
        </div>

        {/* Spec grid */}
        <div className="grid grid-cols-4 gap-x-2 gap-y-4 rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <Spec icon={VenetianMask} label="Type" value={cap(horse.gender)} />
          <Spec icon={CalendarClock} label="Age" value={horse.age != null ? `${horse.age} Years` : ""} />
          <Spec icon={Ruler} label="Height" value={horse.height != null ? `${horse.height} inch` : ""} />
          <Spec icon={Dna} label="Breed" value={horse.breed} />
          <Spec icon={Palette} label="Color" value={horse.color} />
          <Spec icon={MapPin} label="Location" value={horse.location} />
          <Spec icon={Medal} label="Discipline" value={horse.discipline} />
        </div>

        {scope.length > 0 && (
          <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Scope of Work</p>
            <div className="flex flex-wrap gap-2">
              {scope.map((s) => (
                <span key={s} className="flex items-center gap-1 rounded-full border border-[#E9D8AE] bg-[#FBF4E4] px-3 py-1 text-[12px] font-semibold text-[#8A6414]">
                  <ShieldCheck className="h-3.5 w-3.5" /> {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* About + quick facts, side by side like the reference */}
        <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">About this horse</p>
          <div className="flex gap-3">
            {horse.description && <p className="min-w-0 flex-1 text-[13px] leading-5 text-[#0F2238]">{horse.description}</p>}
            <div className="w-[96px] shrink-0 space-y-2 border-l border-[#E4E1D8] pl-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Trained</p>
                <p className="truncate text-[12px] font-semibold text-[#0F2238]">{horse.trainingLevel === "trained" ? "Yes" : cap(horse.trainingLevel) || "—"}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Vaccinated</p>
                <p className="truncate text-[12px] font-semibold text-[#0F2238]">{VACCINATION_LABEL[horse.health?.vaccinationStatus] || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <Section title="Health information">
          <Row label="Vaccination status">{VACCINATION_LABEL[horse.health?.vaccinationStatus] || ""}</Row>
          <Row label="Health notes">{horse.health?.notes}</Row>
        </Section>

        <Section title="Registration details">
          <Row label="Registry">{registration}</Row>
          {!registration && <p className="text-xs text-neutral-500">Not registered or not provided.</p>}
        </Section>

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
        </Section>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

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
              <DateTimePicker value={visitAt} onChange={setVisitAt} />
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

      {/* Fixed price + action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center border-t border-[#E4E1D8] bg-white px-3 py-3">
        <div className="flex w-full max-w-[480px] items-center gap-2">
          <div className="min-w-0 shrink-0">
            <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Price</p>
            <p className="truncate text-[15px] font-extrabold leading-tight text-[#0F2238]">{priceLabel(horse)}</p>
            {!isLease && horse.priceNegotiable && <p className="truncate text-[10px] font-semibold text-emerald-600">(Negotiable)</p>}
          </div>
          <button
            type="button"
            onClick={openChat}
            disabled={enquiring}
            className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#C28D2E] px-2 text-[13px] font-bold text-white disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span className="flex min-w-0 flex-col items-start leading-tight">
              <span className="w-full truncate">{enquiring ? "Opening..." : "Enquire Now"}</span>
              <span className="hidden w-full truncate text-[9px] font-medium text-white/80 min-[380px]:block">Get details from seller</span>
            </span>
          </button>
          {horse.seller?.phone && (
            <a
              href={`tel:${horse.seller.phone}`}
              className="flex h-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-[#0B1C33] px-3 text-[#0B1C33]"
            >
              <Phone className="h-4 w-4" />
              <span className="text-[8px] font-bold">Call</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
