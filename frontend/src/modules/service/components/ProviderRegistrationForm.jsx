import { Check } from "lucide-react"

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
]

export const PROFILE_TYPES = [
  "Horse Owner", "Horse Breeder / Stud Farm", "Riding School", "Horse Trainer", "Casual Rider", "Horse Doctor",
  "Farrier", "Horse Transporter / Ambulance", "Horse Trader", "Feed Manufacturer / Supplier",
  "Horse Accessories Shop / Business", "Horse Photographer", "Event Organizer", "NGO", "Youtuber",
]

export const HORSE_COUNTS = ["NO Horse", "1 - 2", "3 - 5", "5 - 10", "10 - 15", "15 - 20", "20 - 30", "30 - 40", "40 - 50", "50 +"]

export const HORSE_BREEDS = ["I don't have any", "Marwari", "Kathiawari", "Thoroughbred", "Arabian", "Warmblood", "Pony"]

export const emptyRegistration = {
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
  country: "INDIA", // "INDIA" | "OTHER"
  countryOther: "",
  state: "", // a STATES entry or "OTHER"
  stateOther: "",
  city: "",
  location: "",
  profileTypes: [],
  profileOther: "",
  businessName: "",
  horseCount: "",
  horseBreeds: [],
  breedOther: "",
  additionalInfo: "",
  declarationAccepted: false,
}

const inputClass =
  "w-full rounded-lg border border-[#E4E1D8] bg-white px-3 py-2 text-[16px] sm:text-sm text-[#0F2238] placeholder:text-neutral-400 focus:border-[#C28D2E] focus:ring-1 focus:ring-[#C28D2E] focus:outline-none transition"
const textareaClass =
  "w-full rounded-lg border border-[#E4E1D8] bg-white px-3 py-2 text-[16px] sm:text-sm text-[#0F2238] placeholder:text-neutral-400 focus:border-[#C28D2E] focus:ring-1 focus:ring-[#C28D2E] focus:outline-none transition resize-none"

function Section({ title, description, children }) {
  return (
    <div className="rounded-xl border border-[#E7DFD1] bg-white p-4 shadow-2xs sm:p-5">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-[#0F2238] sm:text-base">{title}</h3>
        {description && <p className="mt-0.5 text-[11px] text-neutral-500">{description}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label className="block text-xs font-semibold text-neutral-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {hint && <span className="text-[10px] text-neutral-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const toggle = (list, item) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])

export default function ProviderRegistrationForm({ value, onChange }) {
  const set = (key) => (e) => onChange({ [key]: e.target.value })
  const profileOtherOn = value.profileTypes.includes("Other")
  const breedOtherOn = value.horseBreeds.includes("Other")

  return (
    <div className="space-y-3.5">
      {/* 1. Personal & Contact Details */}
      <Section title="1. Personal & Contact Details" description="How the Ashwa India community and team can reach you.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" required>
            <input
              className={inputClass}
              value={value.name}
              onChange={set("name")}
              placeholder="e.g. Rajesh Singh"
            />
          </Field>

          <Field label="Mobile Number" required hint="10 digits">
            <input
              type="tel"
              inputMode="numeric"
              className={inputClass}
              value={value.phone}
              onChange={(e) => onChange({ phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="e.g. 9876543210"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp Number" hint="If different from mobile">
            <input
              type="tel"
              inputMode="numeric"
              className={inputClass}
              value={value.whatsapp}
              onChange={(e) => onChange({ whatsapp: e.target.value.replace(/\D/g, "").slice(0, 15) })}
              placeholder="e.g. 9876543210"
            />
          </Field>

          <Field label="Email Address" hint="Optional">
            <input
              type="email"
              className={inputClass}
              value={value.email}
              onChange={set("email")}
              placeholder="e.g. yourname@domain.com"
            />
          </Field>
        </div>
      </Section>

      {/* 2. Location */}
      <Section title="2. Location" description="Helps clients and users in your area discover you.">
        <Field label="Country" required>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#0F2238]">
              <input
                type="radio"
                name="country"
                checked={value.country === "INDIA"}
                onChange={() => onChange({ country: "INDIA" })}
                className="h-4 w-4 accent-[#C28D2E]"
              />
              India
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#0F2238]">
              <input
                type="radio"
                name="country"
                checked={value.country === "OTHER"}
                onChange={() => onChange({ country: "OTHER" })}
                className="h-4 w-4 accent-[#C28D2E]"
              />
              Other Country
            </label>
          </div>
          {value.country === "OTHER" && (
            <input
              className={`${inputClass} mt-2`}
              value={value.countryOther}
              onChange={set("countryOther")}
              placeholder="Enter your country name"
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="State" required>
            <select className={inputClass} value={value.state} onChange={set("state")}>
              <option value="">Select your State</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="OTHER">Other State / Territory</option>
            </select>
            {value.state === "OTHER" && (
              <input
                className={`${inputClass} mt-2`}
                value={value.stateOther}
                onChange={set("stateOther")}
                placeholder="Enter state name"
              />
            )}
          </Field>

          <Field label="City / District" required>
            <input
              className={inputClass}
              value={value.city}
              onChange={set("city")}
              placeholder="e.g. Jaipur, Pune, Chandigarh"
            />
          </Field>
        </div>

        <Field label="Full Address / Stable Location" hint="Optional">
          <textarea
            rows={2}
            className={textareaClass}
            value={value.location}
            onChange={set("location")}
            placeholder="Farm, stable or office address"
          />
        </Field>
      </Section>

      {/* 3. Profile & Role in Horse Community */}
      <Section
        title="3. Your Profile / Roles"
        description="Select all categories that apply to you or your stable."
      >
        <Field label="Select Roles" required hint="Select one or more">
          <div className="flex flex-wrap gap-2 pt-1">
            {PROFILE_TYPES.map((p) => {
              const active = value.profileTypes.includes(p)
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => onChange({ profileTypes: toggle(value.profileTypes, p) })}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${active
                    ? "border-[#C28D2E] bg-[#FBF6EC] text-[#7C5A1E] shadow-2xs font-semibold"
                    : "border-[#E4E1D8] bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
                    }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${active ? "border-[#C28D2E] bg-[#C28D2E] text-white" : "border-neutral-300"
                      }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                  </span>
                  <span>{p}</span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => onChange({ profileTypes: toggle(value.profileTypes, "Other") })}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${profileOtherOn
                ? "border-[#C28D2E] bg-[#FBF6EC] text-[#7C5A1E] font-semibold"
                : "border-[#E4E1D8] bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
            >
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${profileOtherOn ? "border-[#C28D2E] bg-[#C28D2E] text-white" : "border-neutral-300"
                  }`}
              >
                {profileOtherOn && <Check className="h-3 w-3" />}
              </span>
              <span>Other</span>
            </button>
          </div>
          {profileOtherOn && (
            <input
              className={`${inputClass} mt-3`}
              value={value.profileOther}
              onChange={set("profileOther")}
              placeholder="Please specify your profile or role"
            />
          )}
        </Field>

        <Field label="Business / Farm / Stable Name" hint="If applicable">
          <input
            className={inputClass}
            value={value.businessName}
            onChange={set("businessName")}
            placeholder="e.g. Royal Marwari Stud Farm"
          />
        </Field>
      </Section>

      {/* 4. Horse & Stable Details */}
      <Section title="4. Horse & Breed Details" description="Information about horses in your stable or care.">
        <Field label="Number of Horses" required>
          <select className={inputClass} value={value.horseCount} onChange={set("horseCount")}>
            <option value="">Select horse count</option>
            {HORSE_COUNTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Horse Breeds you have or work with" hint="Optional">
          <div className="flex flex-wrap gap-2 pt-1">
            {HORSE_BREEDS.map((b) => {
              const active = value.horseBreeds.includes(b)
              return (
                <button
                  type="button"
                  key={b}
                  onClick={() => onChange({ horseBreeds: toggle(value.horseBreeds, b) })}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${active
                    ? "border-[#C28D2E] bg-[#FBF6EC] text-[#7C5A1E] font-semibold shadow-2xs"
                    : "border-[#E4E1D8] bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${active ? "border-[#C28D2E] bg-[#C28D2E] text-white" : "border-neutral-300"
                      }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                  </span>
                  <span>{b}</span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => onChange({ horseBreeds: toggle(value.horseBreeds, "Other") })}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${breedOtherOn
                ? "border-[#C28D2E] bg-[#FBF6EC] text-[#7C5A1E] font-semibold"
                : "border-[#E4E1D8] bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
            >
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${breedOtherOn ? "border-[#C28D2E] bg-[#C28D2E] text-white" : "border-neutral-300"
                  }`}
              >
                {breedOtherOn && <Check className="h-3 w-3" />}
              </span>
              <span>Other Breed</span>
            </button>
          </div>
          {breedOtherOn && (
            <input
              className={`${inputClass} mt-3`}
              value={value.breedOther}
              onChange={set("breedOther")}
              placeholder="Please specify horse breed"
            />
          )}
        </Field>
      </Section>

      {/* 5. Additional Notes & Declaration */}
      <Section title="5. Additional Information & Agreement">
        <Field label="Additional Information or Services" hint="Optional">
          <textarea
            rows={3}
            className={textareaClass}
            value={value.additionalInfo}
            onChange={set("additionalInfo")}
            placeholder="Tell us about special services, certifications, awards, or transport capabilities..."
          />
        </Field>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E7DFD1] bg-[#FBF6EC] p-3.5 text-xs text-[#0F2238] transition hover:bg-[#f7eedc]">
          <input
            type="checkbox"
            checked={value.declarationAccepted}
            onChange={(e) => onChange({ declarationAccepted: e.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#C28D2E]"
          />
          <span className="leading-relaxed">
            I confirm that the information provided is accurate and agree that Ashwa India may use this
            information for directory listing, networking, and official communications.{" "}
            <span className="font-semibold text-red-500">*</span>
          </span>
        </label>
      </Section>
    </div>
  )
}

// Validates the draft; returns an error message or "".
export function validateRegistration(v) {
  if (!v.name.trim()) return "Please enter your full name"
  if (!/^\d{10}$/.test(v.phone)) return "Please enter a valid 10-digit mobile number"
  if (v.country === "OTHER" && !v.countryOther.trim()) return "Please specify your country"
  if (!v.state) return "Please select your state"
  if (v.state === "OTHER" && !v.stateOther.trim()) return "Please specify your state"
  if (!v.city.trim()) return "Please enter your city / district"
  if (v.profileTypes.length === 0) return "Please select at least one role in Your Profile"
  if (v.profileTypes.includes("Other") && !v.profileOther.trim()) return "Please specify your profile under Other"
  if (!v.horseCount) return "Please select the number of horses"
  if (v.horseBreeds.includes("Other") && !v.breedOther.trim()) return "Please specify the horse breed under Other"
  if (v.email.trim() && !/^\S+@\S+\.\S+$/.test(v.email.trim())) return "Please enter a valid email address"
  if (!v.declarationAccepted) return "Please accept the confirmation declaration to proceed"
  return ""
}

// Converts the draft to the API payload.
export function registrationPayload(v) {
  const swapOther = (list, other) => list.map((x) => (x === "Other" ? `Other: ${other.trim()}` : x))
  return {
    name: v.name.trim(),
    phone: v.phone,
    whatsapp: v.whatsapp.trim(),
    email: v.email.trim(),
    country: v.country === "OTHER" ? v.countryOther.trim() : "India",
    state: v.state === "OTHER" ? v.stateOther.trim() : v.state,
    city: v.city.trim(),
    location: v.location.trim(),
    profileTypes: swapOther(v.profileTypes, v.profileOther),
    businessName: v.businessName.trim(),
    horseCount: v.horseCount,
    horseBreeds: swapOther(v.horseBreeds, v.breedOther),
    additionalInfo: v.additionalInfo.trim(),
    declarationAccepted: v.declarationAccepted,
  }
}
