// Provider registration form — mirrors the "Join Ashwaindia - India's Horse Community" Google Form.

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

const inputClass = "h-10 w-full rounded-lg border border-[#E4E1D8] bg-white px-3 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"
const textareaClass = "w-full rounded-lg border border-[#E4E1D8] bg-white px-3 py-2 text-sm text-[#0F2238] outline-none focus:border-[#C28D2E]"

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function Choice({ type, checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-[#0F2238]">
      <input type={type} checked={checked} onChange={onChange} className="h-4 w-4 accent-[#C28D2E]" />
      {label}
    </label>
  )
}

const toggle = (list, item) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])

export default function ProviderRegistrationForm({ phone, value, onChange }) {
  const set = (key) => (e) => onChange({ [key]: e.target.value })
  const profileOtherOn = value.profileTypes.includes("Other")
  const breedOtherOn = value.horseBreeds.includes("Other")

  return (
    <div className="space-y-4">
      <Field label="Full Name" required>
        <input className={inputClass} value={value.name} onChange={set("name")} placeholder="Your answer" />
      </Field>

      <Field label="Mobile Number" required>
        <input className={`${inputClass} bg-neutral-50`} value={phone} readOnly />
      </Field>

      <Field label="Whatsapp Number">
        <input
          inputMode="numeric"
          className={inputClass}
          value={value.whatsapp}
          onChange={(e) => onChange({ whatsapp: e.target.value.replace(/\D/g, "").slice(0, 15) })}
          placeholder="Your answer"
        />
      </Field>

      <Field label="Email Address">
        <input type="email" className={inputClass} value={value.email} onChange={set("email")} placeholder="Your answer" />
      </Field>

      <Field label="Country" required>
        <Choice type="radio" label="INDIA" checked={value.country === "INDIA"} onChange={() => onChange({ country: "INDIA" })} />
        <Choice type="radio" label="OTHER" checked={value.country === "OTHER"} onChange={() => onChange({ country: "OTHER" })} />
        {value.country === "OTHER" && (
          <input className={`${inputClass} mt-1`} value={value.countryOther} onChange={set("countryOther")} placeholder="Other: enter country" />
        )}
      </Field>

      <Field label="State" required>
        <select className={inputClass} value={value.state} onChange={set("state")}>
          <option value="">Choose</option>
          {STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="OTHER">Other</option>
        </select>
        {value.state === "OTHER" && (
          <input className={`${inputClass} mt-2`} value={value.stateOther} onChange={set("stateOther")} placeholder="Other: enter state" />
        )}
      </Field>

      <Field label="City / District" required>
        <input className={inputClass} value={value.city} onChange={set("city")} placeholder="Your answer" />
      </Field>

      <Field label="Full Address">
        <textarea rows={2} className={textareaClass} value={value.location} onChange={set("location")} placeholder="Your answer" />
      </Field>

      <Field label="Your Profile" required>
        {PROFILE_TYPES.map((p) => (
          <Choice key={p} type="checkbox" label={p} checked={value.profileTypes.includes(p)} onChange={() => onChange({ profileTypes: toggle(value.profileTypes, p) })} />
        ))}
        <Choice type="checkbox" label="Other" checked={profileOtherOn} onChange={() => onChange({ profileTypes: toggle(value.profileTypes, "Other") })} />
        {profileOtherOn && (
          <input className={`${inputClass} mt-1`} value={value.profileOther} onChange={set("profileOther")} placeholder="Other: please specify" />
        )}
      </Field>

      <Field label="Business / Farm / Stable Name">
        <input className={inputClass} value={value.businessName} onChange={set("businessName")} placeholder="Your answer" />
      </Field>

      <Field label="Number of Horses" required>
        <select className={inputClass} value={value.horseCount} onChange={set("horseCount")}>
          <option value="">Choose</option>
          {HORSE_COUNTS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      <Field label="Horse Breeds you have">
        {HORSE_BREEDS.map((b) => (
          <Choice key={b} type="checkbox" label={b} checked={value.horseBreeds.includes(b)} onChange={() => onChange({ horseBreeds: toggle(value.horseBreeds, b) })} />
        ))}
        <Choice type="checkbox" label="Other" checked={breedOtherOn} onChange={() => onChange({ horseBreeds: toggle(value.horseBreeds, "Other") })} />
        {breedOtherOn && (
          <input className={`${inputClass} mt-1`} value={value.breedOther} onChange={set("breedOther")} placeholder="Other: please specify" />
        )}
      </Field>

      <Field label="Additional information">
        <textarea rows={3} className={textareaClass} value={value.additionalInfo} onChange={set("additionalInfo")} placeholder="Your answer" />
      </Field>

      <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-[#E4E1D8] bg-[#FBF6EC] p-3 text-xs text-[#0F2238]">
        <input
          type="checkbox"
          checked={value.declarationAccepted}
          onChange={(e) => onChange({ declarationAccepted: e.target.checked })}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#C28D2E]"
        />
        <span>
          I Confirm that the information provided is true and I agree that AshwaIndia may use this information for Directory
          Listing, Networking, and official Communication. <span className="text-red-500">*</span>
        </span>
      </label>
    </div>
  )
}

// Validates the draft; returns an error message or "".
export function validateRegistration(v) {
  if (!v.name.trim()) return "Enter your full name"
  if (v.country === "OTHER" && !v.countryOther.trim()) return "Enter your country"
  if (!v.state) return "Select your state"
  if (v.state === "OTHER" && !v.stateOther.trim()) return "Enter your state"
  if (!v.city.trim()) return "Enter your city / district"
  if (v.profileTypes.length === 0) return "Select at least one option in Your Profile"
  if (v.profileTypes.includes("Other") && !v.profileOther.trim()) return "Specify your profile under Other"
  if (!v.horseCount) return "Select number of horses"
  if (v.horseBreeds.includes("Other") && !v.breedOther.trim()) return "Specify the horse breed under Other"
  if (v.email.trim() && !/^\S+@\S+\.\S+$/.test(v.email.trim())) return "Enter a valid email address"
  if (!v.declarationAccepted) return "Please accept the declaration"
  return ""
}

// Converts the draft to the API payload.
export function registrationPayload(v) {
  const swapOther = (list, other) => list.map((x) => (x === "Other" ? `Other: ${other.trim()}` : x))
  return {
    name: v.name.trim(),
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
