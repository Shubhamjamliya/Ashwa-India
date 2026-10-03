import { useEffect, useState } from "react"
import { Check, MapPin } from "lucide-react"
import { apiFetch } from "@/shared/lib/api"
import ServicePicker from "./ServicePicker"

export const PRICE_UNITS = [
  { value: "visit", label: "per visit" },
  { value: "hour", label: "per hour" },
  { value: "day", label: "per day" },
  { value: "job", label: "per job" },
]

const inputClass = "h-10 w-full rounded-lg border border-[#E4E1D8] bg-white px-3 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"

function Section({ title, hint, children }) {
  return (
    <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
      <div>
        <p className="text-sm font-bold text-[#0F2238]">{title}</p>
        {hint && <p className="mt-0.5 text-[11px] text-neutral-500">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">{label}</label>
      {children}
    </div>
  )
}

// Every profile field a provider fills in. Used at registration and in Edit Profile.
// `value` is the full profile draft; `onChange(patch)` merges changes into it.
export default function ProviderProfileFields({ value, onChange }) {
  const [catalog, setCatalog] = useState([])
  const [zones, setZones] = useState([])

  useEffect(() => {
    apiFetch("/service-catalog", { auth: false }).then((d) => setCatalog(d.services || [])).catch(() => {})
    apiFetch("/zones/active", { auth: false }).then((d) => setZones(d.zones || [])).catch(() => {})
  }, [])

  const nameOf = (key) => catalog.find((s) => s.key === key)?.name || key

  const setPrice = (serviceKey, patch) => {
    const current = value.pricing || []
    const exists = current.find((p) => p.serviceKey === serviceKey)
    const next = exists
      ? current.map((p) => (p.serviceKey === serviceKey ? { ...p, ...patch } : p))
      : [...current, { serviceKey, amount: "", unit: "job", note: "", ...patch }]
    onChange({ pricing: next })
  }

  const toggleZone = (id) => {
    const list = value.serviceZones || []
    onChange({ serviceZones: list.includes(id) ? list.filter((z) => z !== id) : [...list, id] })
  }

  return (
    <div className="space-y-4">
      <Section title="Business profile" hint="How users see your business.">
        <Field label="Business name">
          <input className={inputClass} value={value.businessName || ""} onChange={(e) => onChange({ businessName: e.target.value })} placeholder="e.g. Sharma Equine Clinic" />
        </Field>
        <Field label="About your business">
          <textarea
            rows={3}
            className="w-full rounded-lg border border-[#E4E1D8] bg-white px-3 py-2 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
            value={value.description || ""}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="What you do, how you work, what makes you different"
          />
        </Field>
      </Section>

      <Section title="Services you offer" hint="Choose from the services Ashwa India lists.">
        <ServicePicker value={value.serviceTypes || []} onChange={(serviceTypes) => onChange({ serviceTypes })} />
      </Section>

      <Section title="Pricing" hint="Set your price for each service you selected.">
        {(value.serviceTypes || []).length === 0 ? (
          <p className="text-xs text-neutral-500">Select services above to set prices.</p>
        ) : (
          <div className="space-y-3">
            {value.serviceTypes.map((key) => {
              const price = (value.pricing || []).find((p) => p.serviceKey === key) || {}
              return (
                <div key={key} className="rounded-xl border border-[#E4E1D8] p-3">
                  <p className="mb-2 text-[13px] font-bold capitalize text-[#0F2238]">{nameOf(key)}</p>
                  <div className="grid grid-cols-[1fr_1fr] gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">₹</span>
                      <input
                        inputMode="numeric"
                        className={`${inputClass} pl-7`}
                        value={price.amount ?? ""}
                        onChange={(e) => setPrice(key, { amount: e.target.value.replace(/[^0-9.]/g, "") })}
                        placeholder="Amount"
                      />
                    </div>
                    <select className={inputClass} value={price.unit || "job"} onChange={(e) => setPrice(key, { unit: e.target.value })}>
                      {PRICE_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    className={`${inputClass} mt-2`}
                    value={price.note || ""}
                    onChange={(e) => setPrice(key, { note: e.target.value })}
                    placeholder="Note (optional), e.g. includes medicines"
                  />
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Experience & credentials">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Years of experience">
            <input
              inputMode="numeric"
              className={inputClass}
              value={value.experienceYears ?? ""}
              onChange={(e) => onChange({ experienceYears: e.target.value.replace(/\D/g, "") })}
              placeholder="e.g. 8"
            />
          </Field>
          <Field label="Email">
            <input type="email" className={inputClass} value={value.email || ""} onChange={(e) => onChange({ email: e.target.value })} placeholder="you@example.com" />
          </Field>
        </div>
        <Field label="Certifications">
          <input className={inputClass} value={value.certifications || ""} onChange={(e) => onChange({ certifications: e.target.value })} placeholder="e.g. BVSc, Farrier certificate (2015)" />
        </Field>
      </Section>

      <Section title="Contact details" hint="Shown to users. Your phone number is used for booking calls.">
        <Field label="Address / base location">
          <input className={inputClass} value={value.location || ""} onChange={(e) => onChange({ location: e.target.value })} placeholder="Street, area, city" />
        </Field>
      </Section>

      <Section title="Service area" hint="Pick the zones you serve. Users only see you where they are inside one of these zones.">
        {zones.length === 0 ? (
          <p className="text-xs text-neutral-500">No service zones are set up yet. Please check back later.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {zones.map((zone) => {
              const selected = (value.serviceZones || []).includes(zone.id)
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => toggleZone(zone.id)}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-left ${selected ? "border-[#C28D2E] bg-[#FBF6EC]" : "border-[#E4E1D8] bg-white"}`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected ? "border-[#C28D2E] bg-[#C28D2E]" : "border-neutral-300"}`}>
                    {selected && <Check className="h-3.5 w-3.5 text-white" />}
                  </span>
                  <span className="flex min-w-0 items-center gap-1 text-[13px] font-bold text-[#0F2238]">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                    <span className="truncate">{zone.name}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}

// Converts the draft into the payload the API expects.
export function profilePayload(value) {
  return {
    businessName: (value.businessName || "").trim(),
    description: (value.description || "").trim(),
    experienceYears: value.experienceYears === "" || value.experienceYears == null ? 0 : Number(value.experienceYears),
    certifications: (value.certifications || "").trim(),
    email: (value.email || "").trim(),
    location: (value.location || "").trim(),
    serviceTypes: value.serviceTypes || [],
    pricing: (value.pricing || [])
      .filter((p) => (value.serviceTypes || []).includes(p.serviceKey) && p.amount !== "" && p.amount != null)
      .map((p) => ({ serviceKey: p.serviceKey, amount: Number(p.amount), unit: p.unit || "job", note: p.note || "" })),
    serviceZones: value.serviceZones || [],
  }
}
