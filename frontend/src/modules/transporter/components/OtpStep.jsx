import { Map as MapIcon } from "lucide-react"

// Asks the transporter for the 4-digit OTP the user shows at pickup or drop-off.
export default function OtpStep({ title, hint, value, onChange, onSubmit, busy, cta }) {
  return (
    <div className="space-y-3 rounded-2xl border border-[#E4E1D8] bg-white p-4">
      <div className="flex items-center gap-2">
        <MapIcon className="h-4 w-4 text-[#C28D2E]" />
        <p className="text-sm font-bold text-[#0F2238]">{title}</p>
      </div>
      <p className="text-xs text-neutral-500">{hint}</p>
      <input
        inputMode="numeric"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="4-digit OTP"
        className="h-12 w-full rounded-xl border border-[#E4E1D8] px-4 text-center text-lg font-bold tracking-[0.5em] text-[#0F2238] outline-none focus:border-[#C28D2E]"
      />
      <button
        onClick={onSubmit}
        disabled={busy || value.length !== 4}
        className="w-full rounded-xl bg-[#C28D2E] py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? "Verifying..." : cta}
      </button>
    </div>
  )
}
