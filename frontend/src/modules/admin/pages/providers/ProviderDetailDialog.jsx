import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { getMediaUrl } from "@/shared/lib/media"
import { Check, X, Mail, MapPin, Star, Briefcase, Calendar as CalendarIcon, UserCog, Wrench, Images, Wallet, MessageSquare } from "lucide-react"

const statusLabel = { pending: "Pending", approved: "Approved", rejected: "Rejected", suspended: "Suspended", archived: "Archived" }
const statusBadgeClass = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-neutral-200 text-neutral-700",
  archived: "bg-neutral-200 text-neutral-700",
}
const UNIT_LABEL = { visit: "per visit", hour: "per hour", day: "per day", job: "per job" }

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—")
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—")

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-neutral-500" />
        <p className="text-sm font-bold text-neutral-900">{title}</p>
      </div>
      {children}
    </div>
  )
}

function Item({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="break-words text-sm text-neutral-900">{children || "—"}</p>
    </div>
  )
}

function Stars({ value }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(value) ? "fill-amber-500 text-amber-500" : "text-neutral-300"}`} />
      ))}
    </span>
  )
}

export default function ProviderDetailDialog({ open, onOpenChange, provider, reviews, loading, acting, onApprove, onReject }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl gap-0 overflow-y-auto p-0">
        <DialogHeader className="border-b border-neutral-200 px-6 pb-4 pt-6">
          <DialogTitle className="pr-12 text-xl font-bold text-neutral-900">Provider details</DialogTitle>
        </DialogHeader>

        {loading || !provider ? (
          <div className="px-6 py-16 text-center text-sm text-neutral-500">Loading provider...</div>
        ) : (
          <div className="space-y-4 px-6 py-5">
            <div className="flex flex-col gap-4 rounded-xl bg-neutral-50 p-4 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
                {provider.gallery?.[0] ? (
                  <img src={getMediaUrl(provider.gallery[0])} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserCog className="h-9 w-9 text-neutral-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-neutral-900">{provider.name || "Unnamed"}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass[provider.status]}`}>{statusLabel[provider.status]}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${provider.isOnline === false ? "bg-neutral-200 text-neutral-600" : "bg-emerald-100 text-emerald-700"}`}>
                    {provider.isOnline === false ? "Offline" : "Online"}
                  </span>
                </div>
                <p className="text-sm text-neutral-600">{provider.businessName || "No business name"}</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
                  <Stars value={provider.rating?.average || 0} />
                  <span>{provider.rating?.count ? `${provider.rating.average.toFixed(1)} · ${provider.rating.count} reviews` : "No reviews yet"}</span>
                </div>
              </div>
            </div>

            <Section icon={UserCog} title="Business profile">
              <div className="grid gap-3 sm:grid-cols-2">
                <Item label="Experience">{provider.experienceYears != null ? `${provider.experienceYears} years` : null}</Item>
                <Item label="Certifications">{provider.certifications}</Item>
              </div>
              {provider.description && <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">{provider.description}</p>}
            </Section>

            <Section icon={Wrench} title="Services">
              {provider.serviceTypes?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {provider.serviceTypes.map((s) => (
                    <span key={s} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold capitalize text-amber-800">{s}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No services selected</p>
              )}
            </Section>

            <Section icon={Wallet} title="Pricing">
              {provider.pricing?.length ? (
                <div className="divide-y divide-neutral-100">
                  {provider.pricing.map((p) => (
                    <div key={p.serviceKey} className="flex items-center justify-between py-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold capitalize text-neutral-900">{p.serviceKey}</p>
                        {p.note && <p className="text-xs text-neutral-500">{p.note}</p>}
                      </div>
                      <p className="font-bold text-neutral-900">
                        ₹{p.amount.toLocaleString("en-IN")} <span className="text-xs font-normal text-neutral-500">{UNIT_LABEL[p.unit]}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No prices set</p>
              )}
            </Section>

            <Section icon={MapPin} title="Contact & service area">
              <div className="grid gap-3 sm:grid-cols-2">
                <Item label="Phone">{provider.phone}</Item>
                <Item label="Email">{provider.email}</Item>
                <Item label="Address / base location">{provider.location}</Item>
                <Item label="Map coordinates">
                  {provider.coords?.lat != null ? `${provider.coords.lat.toFixed(4)}, ${provider.coords.lng.toFixed(4)}` : null}
                </Item>
              </div>
              <div className="mt-3">
                <p className="mb-1.5 text-[11px] uppercase tracking-wide text-neutral-500">Service zones</p>
                {provider.serviceZones?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {provider.serviceZones.map((z) => (
                      <span key={z._id} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${z.isActive ? "bg-blue-100 text-blue-700" : "bg-neutral-200 text-neutral-600"}`}>
                        {z.name}
                        {!z.isActive && " (inactive)"}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">No service zones selected</p>
                )}
              </div>
            </Section>

            <Section icon={Images} title={`Gallery (${provider.gallery?.length || 0})`}>
              {provider.gallery?.length ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {provider.gallery.map((url, i) => (
                    <a key={url + i} href={getMediaUrl(url)} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
                      <img src={getMediaUrl(url)} alt="" className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No photos uploaded</p>
              )}
            </Section>

            <Section icon={MessageSquare} title={`Reviews & ratings (${reviews?.length || 0})`}>
              {reviews?.length ? (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-neutral-900">{r.userName}</p>
                        <Stars value={r.rating} />
                      </div>
                      {r.comment && <p className="mt-1 text-sm text-neutral-600">{r.comment}</p>}
                      <p className="mt-1 text-[11px] text-neutral-400">{fmtDate(r.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No reviews yet</p>
              )}
            </Section>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> Joined {fmtDateTime(provider.createdAt)}</span>
              <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Last updated {fmtDateTime(provider.updatedAt)}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> ID {String(provider._id).slice(-8)}</span>
            </div>

            {provider.status === "pending" && (
              <div className="flex gap-2 pt-1">
                <Button className="flex-1" disabled={acting} onClick={() => onApprove(provider._id)}>
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button variant="outline" className="flex-1" disabled={acting} onClick={() => onReject(provider._id)}>
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
